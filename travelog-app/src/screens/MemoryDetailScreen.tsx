import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { api } from '../api';
import { Icon, type IconName } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { Badge, Switch } from '../components/ui';
import { useToast } from '../components/Toast';
import type { TemplateId } from '../types';

const TEMPLATES: { id: TemplateId; name: string }[] = [
  { id: 'magazine', name: '杂志' },
  { id: 'film', name: '胶片' },
  { id: 'minimal', name: '极简' },
];

export function MemoryDetailScreen() {
  const { boxId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const box = useAppStore((s) => s.boxes.find((b) => b.id === boxId));
  const updateBox = useAppStore((s) => s.updateBox);
  const shareBox = useAppStore((s) => s.shareBox);
  const revokeBoxShare = useAppStore((s) => s.revokeBoxShare);
  const deleteBox = useAppStore((s) => s.deleteBox);

  const [tab, setTab] = useState<'story' | 'materials' | 'template'>('story');
  const [day, setDay] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [days, setDays] = useState(7);
  const [password, setPassword] = useState(false);
  const [watermark, setWatermark] = useState(true);
  const [busy, setBusy] = useState(false);

  const currentDay = box?.days?.[Math.min(day, (box.days?.length ?? 1) - 1)];
  const photos = useMemo(() => (box ? (currentDay ? currentDay.photos : box.photos) : []), [box, currentDay]);

  if (!box) {
    return (
      <div className="screen">
        <div className="empty" style={{ paddingTop: 120 }}>
          <b>回忆盒不存在</b>
          <p>它可能已被删除或进入回收站</p>
          <button className="btn ghost" style={{ marginTop: 14 }} onClick={() => navigate('/memory')}>返回回忆</button>
        </div>
      </div>
    );
  }

  const generate = async () => {
    setBusy(true);
    try {
      await api.memory.saveLink(box.id);
      updateBox(box.id, { shareDays: days });
      toast(`链接已生成 · ${days} 天内有效`, 'link');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    await api.memory.revokeLink(box.id);
    toast('链接已撤销 · 原回忆盒权限不变');
    setShareOpen(false);
  };

  const doDelete = () => {
    deleteBox(box.id);
    setDelOpen(false);
    navigate('/memory');
    toast('已移入回收站 · 30 天内可恢复', 'trash');
  };

  return (
    <div className="screen" style={{ paddingBottom: 0 }}>
      <div className="mem-cover">
        <img src={box.cover} alt="" />
        <div className="scrim" />
        <div className="bar">
          <button className="iconbtn dark" onClick={() => navigate('/memory')} aria-label="返回"><Icon name="left" size={18} /></button>
          <div style={{ display: 'flex', gap: 7 }}>
            <button className="iconbtn dark" onClick={() => setShareOpen(true)} aria-label="分享"><Icon name="share" size={17} /></button>
            <button className="iconbtn dark" onClick={() => setMoreOpen(true)} aria-label="更多"><Icon name="more" size={17} /></button>
          </div>
        </div>
        <div className="titles">
          <div className="kicker">{box.kicker}</div>
          <h1>{box.title}</h1>
          <div className="meta"><span>{box.range}</span><i /><span>{box.count} 张</span><i /><span>{box.status === 'draft' ? '编辑中' : '已归档'}</span></div>
        </div>
      </div>

      <div className="mem-tabs">
        {([['story', '预览'], ['materials', '素材'], ['template', '模板']] as const).map(([key, label]) => (
          <button key={key} className={`mem-tab${tab === key ? ' on' : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === 'story' && (
        <>
          {box.days ? (
            <div className="mem-days">
              {box.days.map((d, i) => (
                <button key={d.label} className={`mem-day${i === day ? ' on' : ''}`} onClick={() => setDay(i)}>
                  <b>{d.label}</b><span>{d.date}</span>
                </button>
              ))}
            </div>
          ) : null}
          <div className="day-note">
            <Icon name="map" size={13} />
            {currentDay ? `${currentDay.note} · ${currentDay.photos.length} 张素材` : '本次旅程素材'}
          </div>
          <div className="photo-grid">
            {photos.map((src, i) => (
              <div className="photo" key={`${src}-${i}`}>
                <img src={src} alt="" />
                <span className="loc">西湖</span>
              </div>
            ))}
            <button className="photo add" onClick={() => toast('已打开素材抽屉 · 可批量选择')}><Icon name="plus" size={18} /></button>
          </div>
          <div className="tpl-row" style={{ gridTemplateColumns: '1fr', paddingTop: 14 }}>
            <div className="note-input">
              <Icon name="edit" size={15} />
              <span>给这一天写一句话</span>
              <small>可选</small>
            </div>
          </div>
        </>
      )}

      {tab === 'materials' && (
        <>
          <div className="chips" style={{ paddingTop: 4 }}>
            <span className="chip on">全部 {box.count}</span>
            <span className="chip">照片</span>
            <span className="chip">视频</span>
            <span className="chip">已过滤 6</span>
          </div>
          <div className="photo-grid">
            {[...new Set([...photos, ...box.photos])].slice(0, 9).map((src, i) => (
              <div className="photo" key={`${src}-${i}`}><img src={src} alt="" /></div>
            ))}
            <button className="photo add" onClick={() => toast('从相册添加素材')}><Icon name="plus" size={18} /></button>
          </div>
          <p className="hint" style={{ padding: '12px 20px 0' }}>系统自动去重并过滤截图、模糊照片。被过滤的素材可以恢复。</p>
        </>
      )}

      {tab === 'template' && (
        <>
          <div className="tpl-row" style={{ gridTemplateColumns: '1fr', paddingTop: 4 }}>
            {([
              ['grid', '当前模板', TEMPLATES.find((t) => t.id === box.template)?.name],
              ['music', '背景音乐', box.music ?? '未选择'],
              ['lock', '可见范围', '仅本人可见'],
            ] as [IconName, string, string][]).map(([icon, label, value]) => (
              <div className="setting-line" key={label}>
                <Icon name={icon} size={16} />
                <span>{label}</span>
                <b>{value}</b>
              </div>
            ))}
          </div>
          <div className="tpl-row">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                className={`tpl${box.template === t.id ? ' on' : ''}`}
                onClick={() => { updateBox(box.id, { template: t.id }); toast(`已切换为「${t.name}」模板`); }}
              >
                <div className="mini">
                  <div className="m-img" style={{ backgroundImage: `url(${box.cover})` }} />
                  <div className="m-veil" />
                  <div className="m-t" style={t.id === 'film' ? { fontFamily: 'var(--mono)', fontSize: 7 } : undefined}>{box.title.split(' · ')[0]}</div>
                  <div className="m-line" style={{ bottom: 20 }} />
                  <div className="m-line" style={{ bottom: 15, width: '40%', left: 6, right: 'auto' }} />
                </div>
                <div className="nm">{t.name}<Icon name="check" size={12} /></div>
              </button>
            ))}
          </div>
          <p className="hint" style={{ padding: '2px 20px 0' }}>切换模板会保留已选素材与文字，只改变排版和字体。</p>
        </>
      )}

      <div className="mem-toolbar">
        <button className="mem-tool" onClick={() => setTab('template')}><Icon name="grid" size={19} />模板</button>
        <button className="mem-tool" onClick={() => toast('音乐库：轻音乐 / 城市民谣 / 环境声')}><Icon name="music" size={19} />音乐</button>
        <button className="mem-tool" onClick={() => toast('正在导出视频 · 预计 12 秒')}><Icon name="export" size={19} />导出</button>
        <button className="mem-tool primary" onClick={() => setShareOpen(true)}><Icon name="share" size={19} />分享</button>
      </div>

      <Sheet open={shareOpen} onClose={() => setShareOpen(false)} title="分享回忆盒" sub="链接可设置有效期与水印">
        <div className="share-preview">
          <img src={box.cover} alt="" />
          <div><b>{box.title}</b><span>{box.count} 张照片 · {box.range}</span></div>
          <Badge tone="live" dot>仅链接可见</Badge>
        </div>

        <div className="block-label">链接有效期</div>
        <div className="chips" style={{ padding: '0 0 12px' }}>
          {[1, 7, 30].map((d) => (
            <button key={d} className={`chip${days === d ? ' on' : ''}`} onClick={() => setDays(d)}>{d} 天</button>
          ))}
        </div>

        <div className="menu" style={{ margin: '0 0 12px' }}>
          <label className="mrow">
            <span className="ic"><Icon name="lock" size={15} /></span>
            <span className="t">密码保护<span>访问时需要输入 4 位口令</span></span>
            <span className="r"><Switch checked={password} onChange={setPassword} label="密码保护" /></span>
          </label>
          <label className="mrow">
            <span className="ic"><Icon name="shield" size={15} /></span>
            <span className="t">添加水印<span>导出图片带昵称与日期</span></span>
            <span className="r"><Switch checked={watermark} onChange={setWatermark} label="添加水印" /></span>
          </label>
        </div>

        {box.shared ? (
          <>
            <div className="preview-mini" style={{ margin: '0 0 6px' }}>
              <div className="k">分享链接 · {box.shareDays ?? 7} 天有效</div>
              <div className="share-link">
                <span>{box.shareUrl}</span>
                <button className="btn sm soft" onClick={() => { navigator.clipboard?.writeText(box.shareUrl ?? ''); toast('链接已复制'); }}>复制</button>
              </div>
            </div>
            <p className="hint" style={{ margin: '8px 2px 0' }}>撤销后链接立即失效，但已下载的文件无法追回。</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn ghost" style={{ flex: 1 }} onClick={revoke}>撤销链接</button>
              <button className="btn primary" style={{ flex: 1 }} onClick={() => setShareOpen(false)}>完成</button>
            </div>
          </>
        ) : (
          <>
            <p className="hint" style={{ margin: '2px 2px 0' }}>分享不会改变原回忆盒权限。链接到期后自动失效，可随时撤销。</p>
            <button className="btn primary block" style={{ marginTop: 16 }} onClick={generate} disabled={busy}>
              <Icon name="link" size={16} />{busy ? '生成中…' : '生成分享链接'}
            </button>
          </>
        )}
      </Sheet>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="更多操作">
        <div className="menu" style={{ margin: 0 }}>
          <button className="mrow" onClick={() => { setMoreOpen(false); navigate(`/discover?publish=1&boxId=${box.id}`); }}>
            <span className="ic"><Icon name="compass" size={15} /></span>
            <span className="t">发布到公共区域<span>生成公共副本 · 位置模糊到商圈</span></span>
            <span className="r"><Icon name="right" size={13} /></span>
          </button>
          <button className="mrow" onClick={() => { setMoreOpen(false); toast('已打开封面推荐 · 3 个候选'); }}>
            <span className="ic"><Icon name="image" size={15} /></span>
            <span className="t">更换封面</span><span className="r"><Icon name="right" size={13} /></span>
          </button>
          <button className="mrow" onClick={() => { setMoreOpen(false); toast('开始导出 · 可在后台继续编辑'); }}>
            <span className="ic"><Icon name="download" size={15} /></span>
            <span className="t">导出为视频</span><span className="r">1080P · 约 24MB</span>
          </button>
          <button className="mrow danger" onClick={() => { setMoreOpen(false); setDelOpen(true); }}>
            <span className="ic"><Icon name="trash" size={15} /></span>
            <span className="t">删除回忆盒</span><span className="r">进入 30 天回收站</span>
          </button>
        </div>
        <p className="hint" style={{ margin: '12px 4px 0' }}>发布公共副本后，公共内容与私密原件使用独立的删除逻辑。</p>
      </Sheet>

      <Sheet
        open={delOpen}
        onClose={() => setDelOpen(false)}
        title="删除这个回忆盒？"
        sub="删除后进入 30 天回收站"
        footer={(
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => setDelOpen(false)}>取消</button>
            <button className="btn clay" style={{ flex: 1 }} onClick={doDelete}>删除</button>
          </div>
        )}
      >
        <p className="hint" style={{ fontSize: 12.5, lineHeight: 1.8 }}>
          删除后进入 30 天回收站，所有已生成的分享链接会立即失效。
        </p>
      </Sheet>
    </div>
  );
}
