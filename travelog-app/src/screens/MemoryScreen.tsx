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
      toast('空白回忆盒已创建 · 去添加照片吧');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="screen">
      <div className="apphead">
        <div>
          <h1>回忆</h1>
          <div className="sub">{boxes.length} 个盒子 · {totalPhotos} 张照片</div>
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
                {feature.cover ? <img src={feature.cover} alt={feature.title} /> : <div className="mem-cover-empty"><Icon name="image" size={26} /></div>}
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
            <div className="empty" style={{ paddingTop: 26 }}>
              <div className="ic"><Icon name="layers" size={24} /></div>
              <b>还没有回忆盒</b>
              <p>创建空白回忆盒，再把真实照片和文字放进去</p>
              <button className="btn primary sm" style={{ marginTop: 12 }} onClick={() => setCreateOpen(true)}>
                <Icon name="plus" size={14} />创建第一个回忆盒
              </button>
            </div>
          )}

          {rest.length ? (
            <>
              <div className="section-title"><h2>更多旅程</h2><span className="more">按最近编辑排序</span></div>
              <div className="mem-grid">
                {rest.map((b) => (
                  <button className="mem-card" key={b.id} onClick={() => navigate(`/memory/${b.id}`)}>
                    <div className="ph">
                      {b.cover ? <img src={b.cover} alt="" /> : <div className="mem-cover-empty small"><Icon name="image" size={18} /></div>}
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
        title="创建回忆盒"
        sub="从空白开始，不预置任何照片"
        footer={(
          <button className="btn primary block" style={{ marginTop: 14 }} onClick={create} disabled={creating}>
            <Icon name="plus" size={16} />{creating ? '正在创建…' : '创建空白回忆盒'}
          </button>
        )}
      >
        <div className="empty" style={{ padding: '18px 8px 10px' }}>
          <div className="ic"><Icon name="layers" size={22} /></div>
          <b>先有一个盒子</b>
          <p>创建后进入素材页，从相册添加照片或视频；也可以先写下文字。</p>
        </div>
        <div className="preview-mini">
          <div className="k">创建后</div>
          <div className="line"><span>照片</span><b>0 张 · 由你添加</b></div>
          <div className="line"><span>可见范围</span><b>仅本人可见</b></div>
          <div className="line"><span>自动保存</span><b>本地草稿</b></div>
        </div>
        <p className="hint" style={{ margin: '12px 2px 0' }}>不会读取相册，也不会生成占位照片；所有素材都需要你主动添加。</p>
      </Sheet>
    </div>
  );
}
