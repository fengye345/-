import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { api } from '../api';
import { Icon, type IconName } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { Badge, Chip, Empty } from '../components/ui';
import { useToast } from '../components/Toast';

type Filter = 'all' | 'draft' | 'done' | 'recycle';

export function MemoryScreen() {
  const boxes = useAppStore((s) => s.boxes);
  const recycle = useAppStore((s) => s.recycle);
  const navigate = useNavigate();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const list = boxes.filter((b) => (filter === 'draft' ? b.status === 'draft' : filter === 'done' ? b.status === 'done' : true));
  const feature = list.find((b) => b.status === 'draft') ?? list[0];
  const rest = list.filter((b) => b !== feature);
  const totalPhotos = boxes.reduce((n, b) => n + b.count, 0);

  const create = async () => {
    setCreating(true);
    try {
      const box = await api.memory.create();
      setCreateOpen(false);
      navigate(`/memory/${box.id}`);
      toast('回忆盒已生成 · 默认仅本人可见');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="screen">
      <div className="apphead">
        <div>
          <h1>回忆</h1>
          <div className="sub">{boxes.length} 个盒子 · {totalPhotos} 张照片 · 自动成团</div>
        </div>
        <div className="apphead-actions">
          <button className="iconbtn" onClick={() => toast('按城市、日期或文字查找回忆')} aria-label="搜索">
            <Icon name="search" size={18} />
          </button>
          <button className="iconbtn" onClick={() => setCreateOpen(true)} aria-label="新建">
            <Icon name="plus" size={18} />
          </button>
        </div>
      </div>

      <div className="chips" style={{ paddingTop: 0 }}>
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>全部</Chip>
        <Chip active={filter === 'draft'} onClick={() => setFilter('draft')}>草稿</Chip>
        <Chip active={filter === 'done'} onClick={() => setFilter('done')}>已完成</Chip>
        <Chip active={filter === 'recycle'} onClick={() => setFilter('recycle')}>回收站 {recycle.length}</Chip>
      </div>

      {filter === 'recycle' ? (
        <>
          <div className="section-title"><h2>回收站</h2><span className="more">30 天后自动删除</span></div>
          {recycle.length ? recycle.map((r) => (
            <div className="recycle-row" key={r.id}>
              <Icon name="trash" size={14} />
              <span>{r.title} · {r.deleted}</span>
              <span className="r">剩 {r.left} 天 <Icon name="right" size={12} /></span>
            </div>
          )) : <p className="hint" style={{ padding: '0 20px' }}>回收站是空的</p>}
        </>
      ) : (
        <>
          {feature ? (
            <div className="mem-hero">
              <button className="mem-feature" onClick={() => navigate(`/memory/${feature.id}`)}>
                <img src={feature.cover} alt={feature.title} />
                <div className="veil" />
                <div className="top">
                  <Badge tone="glass">{feature.status === 'draft' ? '草稿 · 自动保存' : '已完成'}</Badge>
                  <Badge tone="glass">{feature.count} 张</Badge>
                </div>
                <div className="bottom">
                  <div className="kicker">{feature.kicker}</div>
                  <h2>{feature.title}</h2>
                  <div className="meta"><span>{feature.range}</span><i /><span>{feature.city}</span><i /><span>{feature.count} 张素材</span></div>
                </div>
                <div className="open"><Icon name="right" size={16} /></div>
              </button>
            </div>
          ) : (
            <Empty title="还没有回忆盒" text="到达新城市后，系统会按时间和地点自动成团" />
          )}

          {rest.length ? (
            <>
              <div className="section-title"><h2>更多旅程</h2><span className="more">按最近编辑排序</span></div>
              <div className="mem-grid">
                {rest.map((b) => (
                  <button className="mem-card" key={b.id} onClick={() => navigate(`/memory/${b.id}`)}>
                    <div className="ph">
                      <img src={b.cover} alt="" />
                      <div className="veil" />
                      <div className="tag">
                        {b.status === 'draft' ? <Badge tone="draft">草稿</Badge> : (
                          <Badge tone="glass">{b.template === 'film' ? '胶片' : b.template === 'minimal' ? '极简' : '杂志'}</Badge>
                        )}
                      </div>
                      <div className="count"><Icon name="image" size={11} /> {b.count}</div>
                    </div>
                    <div className="body">
                      <h3>{b.title}</h3>
                      <div className="meta"><span>{b.range}</span></div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </>
      )}

      <div className="footer-note">回忆盒默认仅本人可见 · 分享会生成带有效期的链接<br />原盒权限不变，撤销链接后已下载的文件无法追回</div>

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="生成新的回忆盒"
        sub="自动识别 · 无需手动建相册"
        footer={(
          <button className="btn primary block" style={{ marginTop: 14 }} onClick={create} disabled={creating}>
            <Icon name="sparkle" size={16} />{creating ? '正在生成…' : '开始生成'}
          </button>
        )}
      >
        <div className="create-steps">
          {([
            ['image', '读取相册授权范围', '仅读取你允许的照片', 'done'],
            ['route', '按时间与地点聚类', '识别为一次旅行（离开常住城市 50km）', 'done'],
            ['sparkle', '去重与智能筛选', '过滤截图、模糊和重复照片', 'running'],
          ] as [IconName, string, string, string][]).map(([icon, title, desc, state]) => (
            <div className={`cstep${state === 'running' ? ' running' : ''}`} key={title}>
              <div className="ico"><Icon name={icon} size={16} /></div>
              <div className="t"><b>{title}</b><span>{desc}</span></div>
              <div className="st">{state === 'done' ? <><Icon name="check" size={12} />完成</> : <><span className="spin" />进行中</>}</div>
            </div>
          ))}
        </div>
        <div className="preview-mini">
          <div className="k">识别结果</div>
          <div className="line"><span>旅行</span><b>杭州 · 2 天 1 夜</b></div>
          <div className="line"><span>可用素材</span><b>18 张照片 · 2 段视频</b></div>
          <div className="line"><span>已过滤</span><b>6 张截图 / 3 张模糊</b></div>
        </div>
        <p className="hint" style={{ margin: '12px 2px 0' }}>生成后可随时增删素材、调整顺序、更换模板。草稿会自动保存到云端。</p>
      </Sheet>
    </div>
  );
}
