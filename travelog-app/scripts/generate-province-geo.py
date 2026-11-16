"""Generate per-province prefecture-city SVG data for the React app.

Source: Aliyun DataV areas_v3 GeoJSON. Output is projected to a local
equirectangular canvas (720x560), simplified, and written as one JSON per
province under travelog-app/public/geo/provinces/.
"""
import json
import math
import os
import re
import ssl
import time
import urllib.request
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
GEO_TS = APP / "src" / "data" / "geo.ts"
OUT = APP / "public" / "geo" / "provinces"
OUT.mkdir(parents=True, exist_ok=True)

W, H, PAD = 720, 560, 34
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE
HEADERS = {"User-Agent": "Mozilla/5.0", "Referer": "https://datav.aliyun.com/"}


def fetch(url, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=40, context=CTX) as r:
                return json.loads(r.read())
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(1.2 + i)
    raise last


def rings_of(geom):
    if not geom:
        return []
    if geom["type"] == "Polygon":
        return [geom["coordinates"][0]]
    if geom["type"] == "MultiPolygon":
        return [poly[0] for poly in geom["coordinates"]]
    return []


def area(ring):
    s = 0.0
    for i in range(len(ring) - 1):
        x1, y1 = ring[i]
        x2, y2 = ring[i + 1]
        s += x1 * y2 - x2 * y1
    return abs(s) / 2


def rdp(points, eps):
    if len(points) < 4:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1:
            continue
        ax, ay = points[a]
        bx, by = points[b]
        dx, dy = bx - ax, by - ay
        norm = math.hypot(dx, dy)
        best, idx = -1.0, -1
        for i in range(a + 1, b):
            px, py = points[i]
            if norm == 0:
                dist = math.hypot(px - ax, py - ay)
            else:
                dist = abs(dy * px - dx * py + bx * ay - by * ax) / norm
            if dist > best:
                best, idx = dist, i
        if best > eps:
            keep[idx] = True
            stack.append((a, idx))
            stack.append((idx, b))
    out = [points[i] for i, k in enumerate(keep) if k]
    return out


ETHNIC = (
    "土家族|苗族|侗族|藏族|羌族|彝族|白族|傣族|景颇族|傈僳族|回族|蒙古族|蒙古|"
    "哈萨克族|哈萨克|柯尔克孜|朝鲜族|布依族|哈尼族|壮族|瑶族|黎族|畲族|水族|"
    "仡佬族|满族|东乡族|裕固族|保安族|撒拉族|土族|锡伯族|达斡尔族|鄂温克族|"
    "鄂伦春族|赫哲族|门巴族|珞巴族|基诺族|布朗族|阿昌族|普米族|怒族|德昂族|"
    "独龙族|纳西族|拉祜族|佤族|毛南族|京族|高山族"
)


def short_label(name):
    n = re.sub(r"(特别行政区|维吾尔自治区|回族自治区|壮族自治区|自治区|省|市)$", "", name)
    if n.endswith("自治州"):
        base = re.sub(ETHNIC, "", n[:-3])
        return base.replace("族", "")
    if n.endswith("地区"):
        return n[:-2]
    if n.endswith("盟"):
        return n[:-1]
    return n


def build(province_adcode, province_name, features):
    all_rings = []
    for f in features:
        for ring in rings_of(f.get("geometry")):
            if len(ring) >= 3:
                all_rings.append(ring)
    lons = [p[0] for r in all_rings for p in r]
    lats = [p[1] for r in all_rings for p in r]
    if not lons:
        raise ValueError("empty geometry")
    min_lon, max_lon = min(lons), max(lons)
    min_lat, max_lat = min(lats), max(lats)
    coslat = math.cos(math.radians((min_lat + max_lat) / 2))
    span_x = max(1e-6, (max_lon - min_lon) * coslat)
    span_y = max(1e-6, max_lat - min_lat)
    scale = min((W - 2 * PAD) / span_x, (H - 2 * PAD) / span_y)
    ox = (W - span_x * scale) / 2
    oy = (H - span_y * scale) / 2

    def project(lon, lat):
        return (ox + (lon - min_lon) * coslat * scale, oy + (max_lat - lat) * scale)

    cities = []
    for f in features:
        prop = f.get("properties", {})
        name = prop.get("name") or "未命名"
        adcode = str(prop.get("adcode") or "")
        rings = []
        for ring in rings_of(f.get("geometry")):
            if len(ring) < 3:
                continue
            pts = [project(p[0], p[1]) for p in ring]
            if area(pts) < 1.2:
                continue
            pts = rdp(pts, 0.85)
            if len(pts) < 3:
                continue
            if pts[0] != pts[-1]:
                pts.append(pts[0])
            rings.append(pts)
        if not rings:
            continue
        d = "".join(
            "M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in ring) + "Z" for ring in rings
        )
        center = prop.get("centroid") or prop.get("center")
        if center and len(center) >= 2:
            cx, cy = project(center[0], center[1])
        else:
            cx = sum(p[0] for r in rings for p in r) / sum(len(r) for r in rings)
            cy = sum(p[1] for r in rings for p in r) / sum(len(r) for r in rings)
        cities.append({
            "n": name,
            "label": short_label(name),
            "a": adcode,
            "x": round(cx, 1),
            "y": round(cy, 1),
            "d": d,
        })

    if not cities:
        raise ValueError("no city polygons")
    cities.sort(key=lambda c: c["a"])
    data = {
        "adcode": province_adcode,
        "name": province_name,
        "w": W,
        "h": H,
        "cities": cities,
    }
    return data


def boundary_as_single(province_adcode, province_name):
    d = fetch(f"https://geo.datav.aliyun.com/areas_v3/bound/{province_adcode}.json")
    features = d.get("features", [])
    if not features:
        raise ValueError("no boundary")
    # Normalize to a single city feature; keep only the outer ring of the province.
    geom = features[0].get("geometry")
    fake = [{"properties": {"name": province_name, "adcode": province_adcode,
                            "center": features[0].get("properties", {}).get("center")},
             "geometry": geom}]
    return build(province_adcode, province_name, fake)


def taiwan_from_china_path():
    """Taiwan has no areas_v3 sub-district data; reuse the China-map outline."""
    text = open(GEO_TS, encoding="utf-8").read()
    m = re.search(r'\{"a":710000,"n":"[^"]+","d":"([^"]+)"', text)
    if not m:
        raise ValueError("taiwan path not found")
    d = m.group(1)
    nums = [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", d)]
    xs, ys = nums[0::2], nums[1::2]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    scale = min((W - 2 * PAD) / max(1e-6, maxx - minx), (H - 2 * PAD) / max(1e-6, maxy - miny))
    ox = (W - (maxx - minx) * scale) / 2
    oy = (H - (maxy - miny) * scale) / 2

    def tx(x, y):
        return ox + (x - minx) * scale, oy + (y - miny) * scale

    # Rebuild the path command by command; the source only uses M/L/Z.
    out = []
    i = 0
    for cmd, x, y in re.findall(r"([MLZ])(?:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?))?", d):
        if cmd == "Z":
            out.append("Z")
        else:
            px, py = tx(float(x), float(y))
            out.append(f"{cmd}{px:.1f},{py:.1f}")
    cx, cy = tx((minx + maxx) / 2, (miny + maxy) / 2)
    return {
        "adcode": "710000",
        "name": "台湾省",
        "w": W,
        "h": H,
        "cities": [{
            "n": "台湾省", "label": "台湾", "a": "710000",
            "x": round(cx, 1), "y": round(cy, 1), "d": "".join(out),
        }],
    }


def main():
    text = open(GEO_TS, encoding="utf-8").read()
    provinces = re.findall(r'\{"a":(\d+),"n":"([^"]+)"', text)
    print("provinces:", len(provinces))
    summary = []
    for adcode, name in provinces:
        path = os.path.join(OUT, f"{adcode}.json")
        if os.path.exists(path):
            summary.append((adcode, name, "cached", os.path.getsize(path)))
            continue
        try:
            if adcode == "710000":
                data = taiwan_from_china_path()
                kind = "single"
            else:
                d = fetch(f"https://geo.datav.aliyun.com/areas_v3/bound/{adcode}_full.json")
                feats = d.get("features", [])
                levels = {f.get("properties", {}).get("level") for f in feats}
                if feats and ("city" in levels or "prefecture" in levels):
                    feats = [f for f in feats
                             if f.get("properties", {}).get("level") in ("city", "prefecture")
                             and "直辖县级" not in str(f.get("properties", {}).get("name"))
                             and str(f.get("properties", {}).get("adcode", "")).endswith("00")]
                    if not feats:
                        raise ValueError("no prefecture-level features after filter")
                    data = build(adcode, name, feats)
                    kind = "prefecture"
                else:
                    data = boundary_as_single(adcode, name)
                    kind = "single"
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
            size = os.path.getsize(path)
            summary.append((adcode, name, kind + f"/{len(data['cities'])}", size))
            print(adcode, name, kind, len(data["cities"]), size)
        except Exception as e:  # noqa: BLE001
            print("FAIL", adcode, name, type(e).__name__, e)
            summary.append((adcode, name, "FAIL", 0))
        time.sleep(0.15)
    total = sum(s[3] for s in summary)
    print("TOTAL BYTES", total, "files", len(summary))
    fails = [s for s in summary if s[2] == "FAIL"]
    print("FAILS", fails)


if __name__ == "__main__":
    main()
