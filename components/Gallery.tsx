"use client";

import { useEffect, useRef, useState } from "react";

type Item = { src: string; alt: string };

export function Gallery({
  items,
  closeLabel,
  previousLabel,
  nextLabel,
}: {
  items: Item[];
  closeLabel: string;
  previousLabel: string;
  nextLabel: string;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [arrowTop, setArrowTop] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const current = index === null ? null : items[index];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (index === null) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        setIndex((value) => (value === null ? value : (value - 1 + items.length) % items.length));
      }
      if (event.key === "ArrowRight") {
        setIndex((value) => (value === null ? value : (value + 1) % items.length));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length]);

  function step(direction: -1 | 1) {
    setIndex((value) => {
      if (value === null || items.length === 0) return value;
      return (value + direction + items.length) % items.length;
    });
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const cards = [...track.querySelectorAll<HTMLElement>(".gallery-card")];
      const edge = track.getBoundingClientRect();
      const first = cards[0]?.getBoundingClientRect();
      const last = cards.at(-1)?.getBoundingClientRect();
      const shot = track.querySelector<HTMLElement>(".shot");
      if (shot) setArrowTop(shot.getBoundingClientRect().height / 2);
      if (!first || !last) {
        setCanPrev(false);
        setCanNext(false);
        return;
      }
      const rtl = getComputedStyle(track).direction === "rtl";
      setCanPrev(rtl ? first.right > edge.right + 2 : first.left < edge.left - 2);
      setCanNext(rtl ? last.left < edge.left - 2 : last.right > edge.right + 2);
    };

    measure();
    track.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [items]);

  function page(direction: -1 | 1) {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>(".gallery-card");
    if (!track || !card) return;
    const styles = getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    const amount = card.getBoundingClientRect().width + gap;
    const rtl = styles.direction === "rtl";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({
      left: (rtl ? -direction : direction) * amount,
      behavior: reduce ? "auto" : "smooth",
    });
  }

  return (
    <>
      <div className="gallery">
        <div className="gallery-grid" ref={trackRef}>
          {items.map((item, itemIndex) => (
            <figure key={item.src} className="gallery-card">
              <button type="button" className="shot" onClick={() => setIndex(itemIndex)}>
                <img src={item.src} alt={item.alt} />
              </button>
              {item.alt ? <figcaption>{item.alt}</figcaption> : null}
            </figure>
          ))}
        </div>
        {canPrev ? (
          <button
            type="button"
            className="gallery-arrow is-prev"
            style={{ top: arrowTop }}
            aria-label={previousLabel}
            onClick={() => page(-1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14.5 5.5 8 12l6.5 6.5" />
            </svg>
          </button>
        ) : null}
        {canNext ? (
          <button
            type="button"
            className="gallery-arrow is-next"
            style={{ top: arrowTop }}
            aria-label={nextLabel}
            onClick={() => page(1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14.5 5.5 8 12l6.5 6.5" />
            </svg>
          </button>
        ) : null}
      </div>
      <dialog
        ref={dialogRef}
        className="lightbox"
        onClose={() => setIndex(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        aria-label={current?.alt || closeLabel}
      >
        {current ? <img src={current.src} alt={current.alt} /> : null}
        {current?.alt ? <p className="lightbox-caption">{current.alt}</p> : null}
        <div className="lightbox-bar">
          <button type="button" onClick={() => step(-1)}>
            {previousLabel}
          </button>
          <button type="button" onClick={() => dialogRef.current?.close()}>
            {closeLabel}
          </button>
          <button type="button" onClick={() => step(1)}>
            {nextLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
