export type ConflictStrategy = 'negative_stock' | 'quota_allocation' | 'conditional_preorder';

export interface SyncQueueItem {
  id: string;
  clientUuid: string;
  terminalType: 'POS_LOCAL' | 'PREVENTA_MOVIL';
  terminalName: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  timestamp: number;
  status: 'QUEUED_OFFLINE' | 'SYNCING' | 'ACCEPTED' | 'ACCEPTED_WITH_BACKORDER' | 'REJECTED';
  resolutionNotes?: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  centralStock: number;
  allocatedToMobile: number;
  priceRetail: number;
  priceWholesale: number;
  pendingDeliveries: number;
}

export interface SystemEvent {
  id: string;
  time: string;
  source: string;
  type: 'INFO' | 'SYNC' | 'CONFLICT' | 'STOCK_ALERT' | 'SUCCESS';
  message: string;
}
