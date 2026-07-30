import { cn } from './lib/cn';

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

// Simple controlled tab row — no compound-component API, callers own the
// active-id state and render whatever content corresponds to it themselves
// (matches how every other stateful piece in this codebase is wired:
// state lives in the page, this component is just markup).
export function Tabs({ tabs, activeId, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-6 border-b border-border', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activeId}
          onClick={() => onChange(tab.id)}
          className={cn(
            'border-b-2 pb-2 text-sm font-medium transition-colors',
            tab.id === activeId
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
