/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category = 'Electronics' | 'Books' | 'Clothing' | 'Furniture' | 'Stationery' | 'Other';

export interface User {
  id: string;
  email: string;
  name: string;
  studentId: string;
  faculty: string;
  role: 'student' | 'admin';
  isBanned: boolean;
  wishlist: string[]; // item IDs
  cart: string[]; // item IDs
  orderHistory: string[]; // item IDs
  phoneNumber?: string;
}

export interface Item {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  images: string[];
  status: 'available' | 'sold' | 'flagged';
  stock: number;
  createdAt: string;
  flagReason?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  participants: string[]; // user IDs
  itemId: string;
  lastMessage?: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string; // item or user ID
  targetType: 'item' | 'user';
  reason: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'chat' | 'system';
  read: boolean;
  createdAt: string;
}
