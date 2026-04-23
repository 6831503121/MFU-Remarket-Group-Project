/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  MessageCircle, 
  User as UserIcon, 
  Home, 
  LogOut, 
  Shield, 
  Heart,
  ArrowUpDown,
  ChevronRight,
  ChevronLeft,
  Camera,
  Trash2,
  AlertTriangle,
  CheckCircle,
  X,
  ShoppingCart,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Item, Category, Chat, Message, Report, Notification } from './types';
import { INITIAL_USERS, INITIAL_ITEMS, CATEGORIES } from './mockData';
import { 
  isValidMfuEmail, 
  sanitizeInput, 
  simulateAiModeration, 
  formatPrice 
} from './utils';

// --- Components ---

const Navbar = ({ 
  currentUser, 
  onNavigate, 
  onLogout, 
  notificationsCount 
}: { 
  currentUser: User | null; 
  onNavigate: (page: string) => void; 
  onLogout: () => void;
  notificationsCount: number;
}) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
    <div className="hidden md:flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
      <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
      <span className="font-bold text-xl text-red-600">MFU Remarket</span>
    </div>
    
    <div className="flex justify-between w-full md:w-auto md:gap-8">
      <button onClick={() => onNavigate('home')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-600 transition-colors">
        <Home size={24} />
        <span className="text-[10px] md:hidden">Home</span>
      </button>
      
      {currentUser && (
        <>
          <button onClick={() => onNavigate('post')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-600 transition-colors">
            <Plus size={24} />
            <span className="text-[10px] md:hidden">Sell</span>
          </button>
          
          <button onClick={() => onNavigate('chats')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-600 transition-colors relative">
            <MessageCircle size={24} />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {notificationsCount}
              </span>
            )}
            <span className="text-[10px] md:hidden">Chat</span>
          </button>

          <button onClick={() => onNavigate('cart')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-600 transition-colors relative">
            <ShoppingCart size={24} />
            {currentUser.cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {currentUser.cart.length}
              </span>
            )}
            <span className="text-[10px] md:hidden">Cart</span>
          </button>
          
          <button onClick={() => onNavigate('profile')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-600 transition-colors">
            <UserIcon size={24} />
            <span className="text-[10px] md:hidden">Profile</span>
          </button>

          {currentUser.role === 'admin' && (
            <button onClick={() => onNavigate('admin')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-600 transition-colors">
              <Shield size={24} />
              <span className="text-[10px] md:hidden">Admin</span>
            </button>
          )}

          <button onClick={onLogout} className="hidden md:flex flex-col items-center gap-1 text-gray-500 hover:text-red-600 transition-colors">
            <LogOut size={24} />
          </button>
        </>
      )}
    </div>
  </nav>
);

// --- Main App ---

export default function App() {
  const [page, setPage] = useState<string>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  
  // Selected Item for Details
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);
  const [showPostSuccess, setShowPostSuccess] = useState(false);

  // --- Auth Handlers ---
  
  const handleLogin = (email: string) => {
    const user = users.find(u => u.email === email);
    if (user) {
      if (user.isBanned) {
        alert('Your account has been banned.');
        return;
      }
      setCurrentUser(user);
      setPage('home');
    } else {
      alert('User not found. Please register.');
    }
  };

  const handleRegister = (newUser: Partial<User>) => {
    if (!newUser.email || !isValidMfuEmail(newUser.email)) {
      alert('Error: Please use your MFU student email (@lamduan.mfu.ac.th) to register. Personal emails (Gmail, Outlook, etc.) are not allowed.');
      return;
    }
    
    const exists = users.find(u => u.email === newUser.email);
    if (exists) {
      alert('Email already registered.');
      return;
    }

    const user: User = {
      id: `u${Date.now()}`,
      email: newUser.email,
      name: newUser.name || 'Anonymous',
      studentId: newUser.studentId || '0000000000',
      faculty: newUser.faculty || 'Other',
      phoneNumber: newUser.phoneNumber || '',
      role: 'student',
      isBanned: false,
      wishlist: [],
      cart: [],
      orderHistory: [],
    };

    setUsers([...users, user]);
    alert('Registration successful! (Simulation: Verification email sent)');
    setCurrentUser(user);
    setPage('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPage('login');
  };

  // --- Item Handlers ---

  const handleCreateItem = (newItem: Partial<Item>) => {
    if (!currentUser) return;
    if (!newItem.title || !newItem.description || !newItem.price || newItem.price < 1 || !newItem.stock || newItem.stock < 1) {
      alert('Please fill in all required fields. Price and Stock must be at least 1.');
      return;
    }

    // AI Moderation Simulation
    const moderation = simulateAiModeration(newItem.title, newItem.description);
    
    const item: Item = {
      id: `i${Date.now()}`,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      title: sanitizeInput(newItem.title),
      description: sanitizeInput(newItem.description),
      price: newItem.price,
      category: newItem.category as Category || 'Other',
      images: newItem.images || ['https://picsum.photos/seed/placeholder/400/300'],
      status: moderation.isFlagged ? 'flagged' : 'available',
      stock: newItem.stock,
      createdAt: new Date().toISOString(),
      flagReason: moderation.reason,
    };

    setItems([item, ...items]);
    
    if (moderation.isFlagged) {
      alert('Item posted but flagged for moderation: ' + moderation.reason);
      setPage('home');
    } else {
      setShowPostSuccess(true);
      // Wait a bit then go home or let user click
      setTimeout(() => {
        setShowPostSuccess(false);
        setPage('home');
      }, 2000);
    }
  };

  const handleToggleWishlist = (itemId: string) => {
    if (!currentUser) return;
    const isWishlisted = currentUser.wishlist.includes(itemId);
    const updatedUser = {
      ...currentUser,
      wishlist: isWishlisted 
        ? currentUser.wishlist.filter(id => id !== itemId)
        : [...currentUser.wishlist, itemId]
    };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const handleAddToCart = (itemId: string) => {
    if (!currentUser) return;
    const item = items.find(i => i.id === itemId);
    if (!item || item.stock === 0) {
      alert('This item is out of stock.');
      return;
    }
    if (currentUser.cart.includes(itemId)) {
      alert('Item is already in your cart.');
      return;
    }
    const updatedUser = {
      ...currentUser,
      cart: [...currentUser.cart, itemId]
    };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
    alert('Item added to cart!');
  };

  const handleRemoveFromCart = (itemId: string) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      cart: currentUser.cart.filter(id => id !== itemId)
    };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const handleCheckout = () => {
    if (!currentUser || currentUser.cart.length === 0) return;
    
    // Decrement stock for items in cart
    const cartItemIds = currentUser.cart;
    setItems(items.map(item => {
      if (cartItemIds.includes(item.id)) {
        const newStock = Math.max(0, item.stock - 1);
        return { 
          ...item, 
          stock: newStock,
          status: newStock === 0 ? 'sold' : item.status 
        };
      }
      return item;
    }));

    // Clear cart and add to order history
    const updatedUser = { 
      ...currentUser, 
      cart: [], 
      orderHistory: [...(currentUser.orderHistory || []), ...cartItemIds] 
    };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
    
    setIsOrderConfirmed(true);
  };

  const handleBuyNow = (itemId: string) => {
    if (!currentUser) return;
    
    // Decrement stock
    setItems(items.map(item => {
      if (item.id === itemId) {
        const newStock = Math.max(0, item.stock - 1);
        return { 
          ...item, 
          stock: newStock,
          status: newStock === 0 ? 'sold' : item.status 
        };
      }
      return item;
    }));

    // Add to order history
    const updatedUser = { 
      ...currentUser, 
      orderHistory: [...(currentUser.orderHistory || []), itemId] 
    };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
    
    setIsOrderConfirmed(true);
  };

  // --- Chat Handlers ---

  const startChat = (itemId: string, sellerId: string) => {
    if (!currentUser) return;
    if (currentUser.id === sellerId) {
      alert('You cannot chat with yourself.');
      return;
    }

    let chat = chats.find(c => c.itemId === itemId && c.participants.includes(currentUser.id));
    
    if (!chat) {
      chat = {
        id: `c${Date.now()}`,
        participants: [currentUser.id, sellerId],
        itemId,
        updatedAt: new Date().toISOString(),
      };
      setChats([chat, ...chats]);
    }

    setSelectedChatId(chat.id);
    setPage('chat-view');
  };

  const sendMessage = (text: string) => {
    if (!currentUser || !selectedChatId) return;
    
    const message: Message = {
      id: `m${Date.now()}`,
      chatId: selectedChatId,
      senderId: currentUser.id,
      text: sanitizeInput(text),
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, message]);
    setChats(chats.map(c => c.id === selectedChatId ? { ...c, lastMessage: text, updatedAt: new Date().toISOString() } : c));
  };

  // --- Filtered Items ---

  const filteredItems = useMemo(() => {
    let result = items.filter(item => item.status !== 'flagged' || (currentUser?.role === 'admin'));
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.description.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter(item => item.category === selectedCategory);
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [items, searchQuery, selectedCategory, sortBy, currentUser]);

  // --- Render Helpers ---

  const renderPage = () => {
    switch (page) {
      case 'login':
        return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />;
      case 'home':
        return (
          <HomeScreen 
            items={filteredItems} 
            categories={CATEGORIES}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onSelectItem={(id: string) => { setSelectedItemId(id); setPage('details'); }}
            currentUser={currentUser}
            onToggleWishlist={handleToggleWishlist}
          />
        );
      case 'details':
        const item = items.find(i => i.id === selectedItemId);
        if (!item) return <div>Item not found</div>;
        return (
          <ItemDetailsScreen 
            item={item} 
            currentUser={currentUser}
            onBack={() => setPage('home')}
            onStartChat={() => startChat(item.id, item.sellerId)}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            isWishlisted={currentUser?.wishlist.includes(item.id) || false}
            onDelete={(id: string) => { setItems(items.filter(i => i.id !== id)); setPage('home'); }}
            onMarkSold={(id: string) => { setItems(items.map(i => i.id === id ? { ...i, status: 'sold' } : i)); }}
          />
        );
      case 'post':
        return <PostItemScreen onSubmit={handleCreateItem} onCancel={() => setPage('home')} />;
      case 'chats':
        return (
          <ChatsListScreen 
            chats={chats.filter(c => c.participants.includes(currentUser?.id || ''))}
            items={items}
            currentUser={currentUser}
            onSelectChat={(id: string) => { setSelectedChatId(id); setPage('chat-view'); }}
          />
        );
      case 'chat-view':
        const chat = chats.find(c => c.id === selectedChatId);
        const chatItem = items.find(i => i.id === chat?.itemId);
        const otherParticipantId = chat?.participants.find(p => p !== currentUser?.id);
        const otherParticipant = users.find(u => u.id === otherParticipantId);
        return (
          <ChatViewScreen 
            chat={chat!}
            item={chatItem!}
            messages={messages.filter(m => m.chatId === selectedChatId)}
            currentUser={currentUser!}
            otherUser={otherParticipant!}
            onSendMessage={sendMessage}
            onBack={() => setPage('chats')}
          />
        );
      case 'profile':
        return (
          <ProfileScreen 
            user={currentUser!} 
            items={items.filter(i => i.sellerId === currentUser?.id)}
            boughtItems={items.filter(i => currentUser?.orderHistory?.includes(i.id))}
            onUpdateUser={(updated: User) => { 
              setCurrentUser(updated); 
              setUsers(users.map(u => u.id === updated.id ? updated : u)); 
            }}
            onSelectItem={(id: string) => { setSelectedItemId(id); setPage('details'); }}
          />
        );
      case 'cart':
        return (
          <CartScreen 
            cartItems={items.filter(i => currentUser?.cart.includes(i.id))}
            onRemove={handleRemoveFromCart}
            onCheckout={handleCheckout}
            onBack={() => setPage('home')}
            isConfirmed={isOrderConfirmed}
            onCloseConfirmation={() => { setIsOrderConfirmed(false); setPage('home'); }}
          />
        );
      case 'admin':
        return (
          <AdminScreen 
            items={items}
            users={users}
            reports={reports}
            onUpdateItem={(id: string, status: any) => setItems(items.map(i => i.id === id ? { ...i, status } : i))}
            onBanUser={(id: string) => setUsers(users.map(u => u.id === id ? { ...u, isBanned: true } : u))}
          />
        );
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pt-16">
      <Navbar 
        currentUser={currentUser} 
        onNavigate={setPage} 
        onLogout={handleLogout}
        notificationsCount={notifications.filter(n => !n.read).length}
      />
      
      <main className="max-w-4xl mx-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Success Modal for Posting */}
      <AnimatePresence>
        {showPostSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={40} strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
              <p className="text-gray-500 mb-8">Your item has been uploaded successfully and is now live on the marketplace.</p>
              <button 
                onClick={() => {
                  setShowPostSuccess(false);
                  setPage('home');
                }}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all"
              >
                Back to Home
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Screen Components ---

const AuthScreen = ({ onLogin, onRegister }: { onLogin: (e: string) => void; onRegister: (u: Partial<User>) => void }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [faculty, setFaculty] = useState('Information Technology');

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4">M</div>
          <h1 className="text-2xl font-bold text-gray-900">MFU Remarket</h1>
          <p className="text-gray-500 text-sm">Student-only marketplace</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 shadow-sm"
        >
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-bold text-red-900">Access Restricted</p>
            <p className="text-xs text-red-700 mt-0.5 leading-relaxed">Please register with your MFU student email or sign in to access the marketplace listings and features.</p>
          </div>
        </motion.div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MFU Email</label>
            <input 
              type="email" 
              placeholder="e.g. 6531501001@lamduan.mfu.ac.th"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="e.g. 081-234-5678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                >
                  <option>Information Technology</option>
                  <option>Management</option>
                  <option>Liberal Arts</option>
                  <option>Science</option>
                  <option>Cosmetic Science</option>
                  <option>Health Science</option>
                  <option>Nursing</option>
                  <option>Medicine</option>
                  <option>Dentistry</option>
                  <option>Law</option>
                  <option>Social Innovation</option>
                  <option>Sinology</option>
                  <option>Integrative Medicine</option>
                </select>
              </div>
            </>
          )}

          <button 
            onClick={() => isRegister ? onRegister({ email, name, studentId, faculty, phoneNumber }) : onLogin(email)}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-md active:scale-[0.98]"
          >
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>

          <div className="text-center mt-6">
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="text-red-600 text-sm font-medium hover:underline"
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomeScreen = ({ 
  items, 
  categories, 
  searchQuery, 
  setSearchQuery, 
  selectedCategory, 
  setSelectedCategory,
  sortBy,
  setSortBy,
  onSelectItem,
  currentUser,
  onToggleWishlist
}: any) => {
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search items, textbooks, gadgets..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button 
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === 'All' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          All
        </button>
        {categories.map((cat: string) => (
          <button 
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-red-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <h2 className="font-bold text-gray-900 text-lg">
          {searchQuery ? `Search results for "${searchQuery}"` : 'Recent Items'}
        </h2>
        <div className="flex items-center gap-2">
          <ArrowUpDown size={16} className="text-gray-400" />
          <select 
            className="bg-transparent text-sm font-medium text-gray-600 outline-none cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item: Item) => (
            <motion.div 
              layout
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="aspect-square relative overflow-hidden">
                <img 
                  src={item.images[0]} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                {item.status === 'sold' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-white text-black px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wider">Sold</span>
                  </div>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleWishlist(item.id); }}
                  className={`absolute top-2 right-2 p-2 rounded-full shadow-sm transition-all ${currentUser?.wishlist.includes(item.id) ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'}`}
                >
                  <Heart size={16} fill={currentUser?.wishlist.includes(item.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="p-3">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">{item.category}</p>
                  <p className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                  </p>
                </div>
                <h3 className="font-bold text-gray-900 truncate mb-1">{item.title}</h3>
                <p className="text-red-600 font-bold">{formatPrice(item.price)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Search size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">No items found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

const ItemDetailsScreen = ({ item, currentUser, onBack, onStartChat, onToggleWishlist, onAddToCart, onBuyNow, isWishlisted, onDelete, onMarkSold }: any) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const isOwner = currentUser?.id === item.sellerId;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Order</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to buy <span className="font-bold text-gray-900">"{item.title}"</span> for <span className="font-bold text-red-600">{formatPrice(item.price)}</span>?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => { onBuyNow(item.id); setShowConfirm(false); }}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors">
        <X size={20} />
        <span className="font-medium">Back to Marketplace</span>
      </button>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <div className="aspect-video relative">
          <img 
            src={item.images[0]} 
            alt={item.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {item.status === 'sold' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-black px-6 py-2 rounded-xl font-bold text-xl uppercase tracking-widest">Sold</span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-red-600 font-bold uppercase tracking-wider mb-1">{item.category}</p>
              <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
              <p className={`text-xs font-bold mt-1 ${item.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {item.stock > 0 ? `Available Stock: ${item.stock}` : 'Out of Stock'}
              </p>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatPrice(item.price)}</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                {item.sellerName[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{item.sellerName}</p>
                <p className="text-xs text-gray-500">Seller • MFU Student</p>
              </div>
            </div>
            {!isOwner && (
              <button 
                onClick={onStartChat}
                disabled={item.status === 'sold'}
                className="px-4 py-2 bg-white border border-red-600 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <MessageCircle size={14} />
                Chat
              </button>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-gray-900">Description</h3>
            <p className="text-gray-600 leading-relaxed">{item.description}</p>
          </div>

          <div className="pt-4 flex gap-3">
            {isOwner ? (
              <>
                <button 
                  onClick={() => onMarkSold(item.id)}
                  disabled={item.status === 'sold' || item.stock === 0}
                  className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark as Sold
                </button>
                <button 
                  onClick={() => onDelete(item.id)}
                  className="p-4 bg-gray-100 text-gray-600 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all"
                >
                  <Trash2 size={24} />
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setShowConfirm(true)}
                  disabled={item.status === 'sold' || item.stock === 0}
                  className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
                <button 
                  onClick={() => onAddToCart(item.id)}
                  disabled={item.status === 'sold' || item.stock === 0}
                  className="flex-1 bg-white border-2 border-red-600 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={20} />
                  Add to Cart
                </button>
                <button 
                  onClick={() => onToggleWishlist(item.id)}
                  className={`p-4 rounded-2xl transition-all ${isWishlisted ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <Heart size={24} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
              </>
            )}
          </div>
          
          {isAdmin && !isOwner && (
            <div className="mt-4 p-4 border-2 border-dashed border-red-200 rounded-2xl bg-red-50">
              <p className="text-red-600 font-bold text-sm mb-2 flex items-center gap-2">
                <Shield size={16} /> Admin Controls
              </p>
              <button 
                onClick={() => onDelete(item.id)}
                className="w-full bg-red-600 text-white py-2 rounded-xl text-sm font-bold"
              >
                Remove Listing
              </button>
            </div>
          )}

          {!isOwner && !isAdmin && (
            <button 
              onClick={() => alert('Item reported to admin for review.')}
              className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1 mt-4"
            >
              <AlertTriangle size={12} />
              Report this listing
            </button>
          )}
        </div>
      </div>
      
      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
        <AlertTriangle className="text-blue-500 shrink-0" size={20} />
        <p className="text-xs text-blue-700">
          <strong>Safety Tip:</strong> Always meet on campus (e.g., M-Square or Library) and verify the item before paying. Never send money in advance.
        </p>
      </div>
    </div>
  );
};

const PostItemScreen = ({ onSubmit, onCancel }: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(1);
  const [category, setCategory] = useState<Category>('Other');
  const [images, setImages] = useState<string[]>([]);

  const handleAddImage = () => {
    if (images.length >= 5) {
      alert('Maximum 5 images allowed.');
      return;
    }
    const newImg = `https://picsum.photos/seed/${Date.now()}/400/300`;
    setImages([...images, newImg]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Post New Item</h1>
        <button onClick={onCancel} className="text-gray-500 hover:text-red-600">Cancel</button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Item Images (Max 5)</label>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <div key={idx} className="w-24 h-24 rounded-xl overflow-hidden relative shrink-0">
                  <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button 
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button 
                  onClick={handleAddImage}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-500 transition-all shrink-0"
                >
                  <Camera size={24} />
                  <span className="text-[10px] mt-1 font-bold">Add Photo</span>
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Item Title</label>
            <input 
              type="text" 
              placeholder="What are you selling?"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Price (THB)</label>
              <input 
                type="number" 
                min="1"
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                value={price || ''}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Stock</label>
              <input 
                type="number" 
                min="1"
                placeholder="1"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                value={stock || ''}
                onChange={(e) => setStock(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
              <select 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea 
              rows={4}
              placeholder="Describe your item (condition, usage, etc.)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <button 
          onClick={() => onSubmit({ title, description, price, stock, category, images })}
          className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-[0.98]"
        >
          Post Item
        </button>
      </div>
    </div>
  );
};

const ChatsListScreen = ({ chats, items, currentUser, onSelectChat }: any) => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
      
      {chats.length > 0 ? (
        <div className="space-y-3">
          {chats.map((chat: Chat) => {
            const item = items.find(i => i.id === chat.itemId);
            return (
              <div 
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-red-200 transition-all"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  <img src={item?.images[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{item?.title}</h3>
                  <p className="text-sm text-gray-500 truncate">{chat.lastMessage || 'Start a conversation...'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-gray-400">{new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <ChevronRight size={16} className="text-gray-300 ml-auto mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <MessageCircle size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">No messages yet</p>
          <p className="text-sm">Start a chat from an item page</p>
        </div>
      )}
    </div>
  );
};

const ChatViewScreen = ({ chat, item, messages, currentUser, otherUser, onSendMessage, onBack }: any) => {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-[85vh] md:h-[80vh]">
      <div className="bg-white p-4 rounded-t-3xl border-b border-gray-100 flex items-center gap-4">
        <button onClick={onBack} className="text-gray-500"><X size={24} /></button>
        <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600 font-bold">
          {otherUser?.name[0] || '?'}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-sm">{otherUser?.name}</h3>
          <p className="text-[10px] text-gray-500 truncate">Regarding: {item?.title}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg: Message) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe ? 'bg-red-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'}`}>
                {msg.text}
                <p className={`text-[8px] mt-1 ${isMe ? 'text-red-200' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-4 rounded-b-3xl border-t border-gray-100 flex gap-2">
        <input 
          type="text" 
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e: any) => e.key === 'Enter' && handleSend()}
        />
        <button 
          onClick={handleSend}
          className="bg-red-600 text-white p-3 rounded-xl hover:bg-red-700 transition-all"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

const ProfileScreen = ({ user, items, boughtItems, onUpdateUser, onSelectItem }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [faculty, setFaculty] = useState(user.faculty);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');

  const handleSave = () => {
    onUpdateUser({ ...user, name, faculty, phoneNumber });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-4xl font-bold mb-4">
          {user.name[0]}
        </div>
        
        {isEditing ? (
          <div className="w-full space-y-4 max-w-xs text-left">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Name</label>
              <input 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Phone</label>
              <input 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Faculty</label>
              <select 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
              >
                <option>Information Technology</option>
                <option>Management</option>
                <option>Liberal Arts</option>
                <option>Science</option>
                <option>Cosmetic Science</option>
                <option>Health Science</option>
                <option>Nursing</option>
                <option>Medicine</option>
                <option>Dentistry</option>
                <option>Law</option>
                <option>Social Innovation</option>
                <option>Sinology</option>
                <option>Integrative Medicine</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold">Save</button>
              <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-bold">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500 font-medium">{user.faculty}</p>
            <p className="text-xs text-gray-400 mt-1">ID: {user.studentId} • {user.email}</p>
            <p className="text-xs text-gray-400 mt-1">Phone: {user.phoneNumber || 'Not set'}</p>
            <button 
              onClick={() => setIsEditing(true)}
              className="mt-4 px-6 py-2 border border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Edit Profile
            </button>
          </>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Order History</h2>
        {boughtItems && boughtItems.length > 0 ? (
          <div className="space-y-3">
            {boughtItems.map((item: Item) => (
              <div 
                key={item.id}
                onClick={() => onSelectItem(item.id)}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-red-200 transition-all"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  <img src={item.images[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate text-sm">{item.title}</h3>
                  <p className="text-red-600 font-bold text-sm">{formatPrice(item.price)}</p>
                </div>
                <div className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                  Bought
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
            <p>No orders yet.</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">My Listings</h2>
        {items.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {items.map((item: Item) => (
              <div 
                key={item.id} 
                onClick={() => onSelectItem(item.id)}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm cursor-pointer"
              >
                <div className="aspect-square relative">
                  <img src={item.images[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  {item.status === 'sold' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-white text-black px-2 py-1 rounded-lg font-bold text-[10px] uppercase">Sold</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-gray-900 truncate text-sm">{item.title}</h3>
                  <p className="text-red-600 font-bold text-sm">{formatPrice(item.price)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
            <p>You haven't posted any items yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Cart Screen ---

const CartScreen = ({ 
  cartItems, 
  onRemove, 
  onCheckout, 
  onBack, 
  isConfirmed, 
  onCloseConfirmation 
}: { 
  cartItems: Item[], 
  onRemove: (id: string) => void, 
  onCheckout: () => void, 
  onBack: () => void,
  isConfirmed: boolean,
  onCloseConfirmation: () => void
}) => {
  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  if (isConfirmed) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6"
        >
          <Check size={48} strokeWidth={3} />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
        <p className="text-gray-600 mb-8 max-w-xs">
          Your order has been placed successfully. Please contact the sellers to arrange meetups.
        </p>
        <button
          onClick={onCloseConfirmation}
          className="w-full max-w-xs py-4 bg-red-600 text-white rounded-2xl font-bold shadow-xl hover:bg-red-700 transition-all"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">My Cart</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <ShoppingCart size={40} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Your cart is empty</h3>
            <p className="text-gray-500 mt-1">Browse the marketplace to add items.</p>
            <button
              onClick={onBack}
              className="mt-6 px-8 py-3 bg-red-600 text-white rounded-xl font-semibold shadow-lg"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 rounded-2xl shadow-sm flex gap-4 border border-gray-100"
              >
                <img 
                  src={item.images[0]} 
                  alt={item.title} 
                  className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{item.title}</h3>
                  <p className="text-red-600 font-bold mt-1">{formatPrice(item.price)}</p>
                  <p className="text-xs text-gray-500 mt-1">Seller: {item.sellerName}</p>
                </div>
                <button 
                  onClick={() => onRemove(item.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors self-start"
                >
                  <Trash2 size={20} />
                </button>
              </motion.div>
            ))}

            <div className="mt-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-600 font-medium">Total Amount</span>
                <span className="text-2xl font-black text-gray-900">{formatPrice(total)}</span>
              </div>
              <button
                onClick={onCheckout}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold shadow-xl hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                Confirm Order
              </button>
              <p className="text-center text-xs text-gray-400 mt-4">
                By confirming, you agree to meet the seller on campus for transaction.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminScreen = ({ items, users, onUpdateItem, onBanUser }: any) => {
  const flaggedItems = items.filter((i: Item) => i.status === 'flagged');
  
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Shield className="text-red-600" size={32} />
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Total Items</p>
          <p className="text-4xl font-bold text-gray-900">{items.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Total Users</p>
          <p className="text-4xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-red-600 text-sm font-bold uppercase tracking-wider mb-1">Flagged Items</p>
          <p className="text-4xl font-bold text-red-600">{flaggedItems.length}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-500" />
          Items Requiring Moderation
        </h2>
        
        {flaggedItems.length > 0 ? (
          <div className="space-y-4">
            {flaggedItems.map((item: Item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm flex gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <img src={item.images[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{item.title}</h3>
                  <p className="text-xs text-red-500 font-bold mb-2">Reason: {item.flagReason}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onUpdateItem(item.id, 'available')}
                      className="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-all"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => onUpdateItem(item.id, 'flagged')}
                      className="px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center text-gray-400 flex flex-col items-center">
            <CheckCircle size={48} className="mb-4 text-green-500 opacity-20" />
            <p>No items flagged for moderation.</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">User Management</h2>
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-700">Name</th>
                <th className="px-6 py-4 font-bold text-gray-700">Email</th>
                <th className="px-6 py-4 font-bold text-gray-700">Status</th>
                <th className="px-6 py-4 font-bold text-gray-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.filter((u: User) => u.role !== 'admin').map((u: User) => (
                <tr key={u.id}>
                  <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                  <td className="px-6 py-4 text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${u.isBanned ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {u.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!u.isBanned && (
                      <button 
                        onClick={() => onBanUser(u.id)}
                        className="text-red-600 font-bold hover:underline"
                      >
                        Ban
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
