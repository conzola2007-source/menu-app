'use client';

/**
 * Sheet — standardised bottom-sheet component.
 *
 * Behaviour:
 *  • Opens at 50 % of viewport height (collapsed).
 *  • Drag up  → expands to 90 % (if content is tall enough to warrant it).
 *  • Drag down from expanded → collapses back to 50 %.
 *  • Drag down from collapsed → dismisses.
 *  • Content scrolls independently; sheet height does NOT change on scroll.
 *  • If all content fits within the 50 % snap, expansion is disabled.
 *
 * Implementation note:
 *  The sheet div is always 90 vh tall.  A y-translation of 40 vh reveals only
 *  the bottom 50 vh (collapsed).  y = 0 vh reveals the full 90 vh (expanded).
 *  Entry/exit animates from y = 90 vh (fully off-screen).
 */

import { ReactNode, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Simple text title — renders a standard header row. */
  title?: string;
  /**
   * Custom header content rendered to the left of the close button.
   * Overrides `title` when provided.
   */
  headerContent?: ReactNode;
  children: ReactNode;
}

const SPRING = { type: 'spring', damping: 30, stiffness: 300 } as const;

export function Sheet({ isOpen, onClose, title, headerContent, children }: SheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand]   = useState(true);
  const [mounted, setMounted]       = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Ensure we only portal on the client.
  useEffect(() => setMounted(true), []);

  // Always reset to collapsed whenever the sheet is (re-)opened.
  useEffect(() => {
    if (isOpen) setIsExpanded(false);
  }, [isOpen]);

  // After the sheet opens, measure whether the content overflows the collapsed
  // content area. If it doesn't, there is nothing to expand into.
  useEffect(() => {
    if (!isOpen || !contentRef.current) return;
    const el = contentRef.current;

    const check = () => {
      // scrollHeight > clientHeight means content overflows → expansion useful.
      setCanExpand(el.scrollHeight > el.clientHeight + 8);
    };

    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen, children]);

  // y = 40 vh → only bottom 50 vh visible (collapsed).
  // y = 0 vh  → full 90 vh visible (expanded).
  const targetY = isExpanded ? '0vh' : '40vh';

  function handleDragEnd(_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    const { velocity, offset } = info;

    if (isExpanded) {
      // Drag down → collapse (or fast flick).
      if (velocity.y > 500 || offset.y > 120) setIsExpanded(false);
    } else {
      // Drag up → expand (only if content justifies it).
      if ((velocity.y < -400 || offset.y < -60) && canExpand) {
        setIsExpanded(true);
      }
      // Drag down → dismiss.
      else if (velocity.y > 500 || offset.y > 100) {
        onClose();
      }
    }
  }

  const hasHeader = !!(title || headerContent);

  const panel = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ─────────────────────────────────────────────────── */}
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* ── Sheet panel ──────────────────────────────────────────────── */}
          <motion.div
            key="sheet-panel"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: canExpand ? 0.1 : 0.02, bottom: 0.2 }}
            onDragEnd={handleDragEnd}
            initial={{ y: '90vh' }}
            animate={{ y: targetY }}
            exit={{ y: '90vh' }}
            transition={SPRING}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl border-t border-slate-700 bg-slate-900 shadow-2xl"
            style={{ height: '90vh' }}
          >
            {/* Drag handle */}
            <div className="flex shrink-0 cursor-grab justify-center pb-1 pt-3 active:cursor-grabbing">
              <div className="h-1 w-10 rounded-full bg-slate-600" />
            </div>

            {/* Header */}
            {hasHeader && (
              <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 py-3">
                {headerContent ?? (
                  <p className="text-sm font-semibold text-white">{title}</p>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-full p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* ── Scrollable content area ────────────────────────────────── */}
            {/* stopPropagation when content is scrolled prevents drag      */}
            {/* events inside the scroll area from moving the sheet itself.  */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto overscroll-contain"
              onPointerDown={(e) => {
                if (contentRef.current && contentRef.current.scrollTop > 0) {
                  e.stopPropagation();
                }
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(panel, document.body);
}
