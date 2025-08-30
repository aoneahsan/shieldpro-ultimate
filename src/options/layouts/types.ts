export type LayoutType = 'tabs' | 'sidebar' | 'header' | 'header-sidebar';

export interface LayoutProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export interface TabItem {
  id: string;
  label: string;
  icon: any;
}
