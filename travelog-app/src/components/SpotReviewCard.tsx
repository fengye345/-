import { useState } from 'react';
import { Icon } from './Icon';
import { Avatar, Badge } from './ui';
import type { SpotReview } from '../data/scenic';

interface Props {
  review: SpotReview;
  onSpot: () => void;
}

export function SpotReviewCard({ review, onSpot }: Props) {
  const [liked, setLiked] = useState(false);
  const avoid = review.kind === 'AVOID';

  return (
    <article className={`rv-card${avoid ? ' avoid' : ''}`}>
      <div className="rv-head">
        <Avatar initial={review.initial} hue={review.hue} size={30} />
        <div className="rv-who">
          <b>{review.author}</b>
          <span>{review.ago} · {review.city}</span>
        </div>
        <Badge tone={avoid ? 'clay' : 'on'}>{avoid ? '避坑' : '推荐'}</Badge>
      </div>

      <button className="rv-spot" onClick={onSpot}>
        <Icon name="pin" size={12} />
        <span>{review.spotName}</span>
        <Icon name="right" size={11} />
      </button>

      <p className="rv-text">{review.text}</p>

      <div className="rv-tags">
        {review.tags.map((t) => <span key={t}>{t}</span>)}
      </div>

      <div className="rv-foot">
        <button className={liked ? 'on' : ''} onClick={() => setLiked((v) => !v)}>
          <Icon name="heart" size={13} filled={liked} />有用 {review.likes + (liked ? 1 : 0)}
        </button>
        <button onClick={onSpot}>景区详情 <Icon name="right" size={11} /></button>
      </div>
    </article>
  );
}
