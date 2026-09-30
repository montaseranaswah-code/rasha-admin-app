import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://127.0.0.1:8000/api';
const U = (id, w = 600) => `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

// دالة جلب الصور الحقيقية من مجلد public/products/
const PI = (file) => `/products/${file}`;

const placeholder = (name = '', brand = '') => {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
  <defs><linearGradient id="g" x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#f6efe3'/><stop offset='1' stop-color='#e6edb3'/></linearGradient></defs>
  <rect width='100%' height='100%' fill='url(#g)'/>
  <text x='50%' y='44%' text-anchor='middle' font-size='34' font-family='Georgia,serif' font-weight='700' fill='#98793f'>${esc(brand)}</text>
  <text x='50%' y='54%' text-anchor='middle' font-size='22' font-family='Tajawal,sans-serif' fill='#5b5140'>${esc(String(name)).slice(0, 32)}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const imgFail = (p) => (e) => { e.currentTarget.onerror = null; e.currentTarget.src = placeholder(p.name, p.brand?.name); };

const slides = [
  { image: U('photo-1615397349754-cfa2066a298e', 1600), title: 'عطور النيش الحصرية', subtitle: 'خصم يصل إلى 40% على أرقى الماركات العالمية', cat: 'للجنسين' },
  { image: U('photo-1522337360788-8b13dee7a37e', 1600), title: 'بوكسات المكياج الفاخرة', subtitle: 'طقم متكامل بسعر مناسب وشحن سريع لكل المحافظات', cat: 'مكياج' },
  { image: U('photo-1547887537-6158d64c35b3', 1600), title: 'بكجات الهدايا', subtitle: 'اختاري عطرين بنفسك ونغلفهما لك هدية ملكية', cat: 'بكجات الهدايا' }
];

const categoryTiles = [
  { name: 'عطور رجالية', image: U('photo-1594035910387-fea47794261f') },
  { name: 'عطور نسائية', image: U('photo-1592945403244-b3fbafd7f539') },
  { name: 'للجنسين', image: U('photo-1523293182086-7651a899d37f') },
  { name: 'بكجات الهدايا', image: U('photo-1563170351-be82bc888aa4') },
  { name: 'مكياج', image: U('photo-1512496015851-a90fb38ba796') }
];

const perks = [
  { icon: '🚚', t: 'شحن سريع', d: 'توصيل لجميع محافظات المملكة الأردنية' },
  { icon: '🛡', t: 'أصلي 100%', d: 'منتجات معتمدة وبضمان الوكيل' },
  { icon: '💳', t: 'الدفع عند الاستلام', d: 'أو بالبطاقة، أنت تختار' },
  { icon: '🔄', t: 'استبدال سهل', d: 'خلال 7 أيام من الاستلام' }
];

const brands = ['XERJOFF', 'TOM FORD', 'PARFUMS de MARLY', 'CREED', 'DIOR', 'CHANEL', 'E.L.F', 'FENTY BEAUTY'];

// بناء المنتجات الافتراضية
const P = (id, name, brand, cat, img, price, old, rating, reviews, sold, desc) => ({
  id, name, brand: { name: brand }, category: { name: cat }, image: PI(img), gallery: [PI(img)],
  oldPrice: old.toFixed(2), discount: Math.round((1 - price / old) * 100) + '%', rating, reviewsCount: reviews, sold, description: desc,
  variants: [{ id: id + '-v', size: '100 مل', retail_price: price, wholesale_price: Math.round(price * 0.82) }]
});

const M = (id, name, brand, img, gal, price, old, reviews, badge, contents = [], features = []) => ({
  id, name, brand: { name: brand }, category: { name: 'مكياج' }, image: PI(img), gallery: gal.map(g => PI(g)),
  oldPrice: old.toFixed(2), discount: Math.round((1 - price / old) * 100) + '%', rating: 5, reviewsCount: reviews, sold: reviews * 4, badge,
  description: name + ' - مكياج أصلي عالي الثبات مناسب لجميع درجات البشرة.',
  contents, features, variants: [{ id: id + '-v', size: 'طقم متكامل', retail_price: price, wholesale_price: Math.round(price * 0.85) }]
});

const defaultProducts = [
  P('p1', 'عطر ليدر أو دو بارفيوم 100مل', 'SAMAH', 'عطور رجالية', 'leader.jpg', 28, 40, 5, 12, 72, 'افتتاحية باتشولي بنوتات خضراء، قلب من الليمون، وقاعدة من المارشميلو.'),
  P('p2', 'عطر أفنان 9 PM 100مل', 'AFNAN', 'عطور رجالية', 'afnan-9pm.jpg', 25, 35, 5, 31, 210, 'عطر حلو دافئ بنوتات الفانيلا والقرفة، مناسب للمناسبات.'),
  P('p3', 'عطر غابريلس ذا كنج 100مل', 'YES I AM', 'عطور رجالية', 'gabriless.jpg', 18, 25, 4, 9, 54, 'انتعاش أخضر بنوتات الحمضيات والأخشاب.'),
  P('p4', 'عطر هاج سينت أكاسيا 100مل', 'HUG SCENT', 'عطور نسائية', 'hug-scent.jpg', 22, 32, 5, 18, 96, 'أزهار الأكاسيا مع العبير والمسك الأبيض.'),
  P('p5', 'عطر زيرجوف نيش 100مل', 'XERJOFF', 'للجنسين', 'xerjoff.jpg', 195, 260, 5, 44, 130, 'عطر نيش إيطالي فاخر بنوتات العود.'),
  P('p6', 'عطر ماركلي 125مل', 'PARFUMS de MARLY', 'للجنسين', 'marly.jpg', 210, 280, 5, 27, 88, 'فخامة فرنسية، بنوتات التفاح والقرفة.'),
  P('p7', 'بكج هدية عطرين مختارين', 'ROYAL GIFT', 'بكجات الهدايا', 'gift.jpg', 45, 65, 5, 15, 47, 'نغلفهما لك في علبة هدية أنيقة.'),
  M('m1', 'بوكس مكياج elf الأسود', 'E.L.F', 'elf-black.jpg', ['elf-black.jpg'], 35, 55, 16, 'جديد', ['أرواج وظلال عيون'], ['متكامل']),
  M('m3', 'طقم مكياج فاخر 6 قطع', 'FENTY BEAUTY', 'fenty-6.jpg', ['fenty-6.jpg'], 22, 35, 69, 'محدود')
];

const Stars = ({ n = 5 }) => <span className="stars">{'★'.repeat(n)}<i>{'★'.repeat(5 - n)}</i></span>;
const Icon = ({ d, size = 22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
const ICONS = { cart: 'M6 6h15l-1.5 9h-12zm6 6L5 3H2M9 20a1 1 0 100-2 1 1 0 000 2zm18 0a1 1 0 100-2 1 1 0 000 2z', user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6', heart: 'M12 21s-8-5.5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.5-8 11-8 11z', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z', search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3', close: 'M6 6l12 12M18 6L6 18', menu: 'M3 6h18M3 12h18M3 18h18', bag: 'M5 8h14l-1 12H6z M9 6a3 3 0 016 0' };

function App() {
  // 1. نظام حفظ المنتجات لضمان مزامنة إضافات وحذف الأدمن للمستخدم العادي
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('rasha_products');
    return saved ? JSON.parse(saved) : defaultProducts;
  });

  // 2. نظام حفظ الطلبات لضمان رؤية المستخدم لتحديثات حالة طلبه
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('rasha_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // 3. نظام حفظ المستخدم (يوزر أو أدمن) ليبقى مسجل الدخول
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rasha_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('shop');
  const [authMode, setAuthMode] = useState('login');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('favs')) || []);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [showTop, setShowTop] = useState(false);

  const [packageSelections, setPackageSelections] = useState({});
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [cart, setCart] = useState([]);
  const bestRef = useRef(null);

  // حالات إضافة منتج جديد (للأدمن)
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductImage, setNewProductImage] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('عطور نسائية');

  const notify = (msg) => { setToast(msg); clearTimeout(notify.t); notify.t = setTimeout(() => setToast(''), 3000); };

  // حفظ التغييرات في LocalStorage لتبقى ظاهرة دائماً
  useEffect(() => { localStorage.setItem('rasha_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('rasha_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { 
    if(user) localStorage.setItem('rasha_user', JSON.stringify(user)); 
    else localStorage.removeItem('rasha_user');
  }, [user]);
  useEffect(() => { localStorage.setItem('favs', JSON.stringify(favorites)); }, [favorites]);
  
  useEffect(() => { window.scrollTo({ top: 0 }); }, [view]);
  useEffect(() => { document.body.style.overflow = selectedProduct || cartOpen ? 'hidden' : ''; }, [selectedProduct, cartOpen]);
  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(p => (p + 1) % slides.length), 6000);
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll);
    return () => { clearInterval(timer); window.removeEventListener('scroll', onScroll); };
  }, []);

  const fmt = (n) => Number(n).toFixed(2).replace(/\.00$/, '');

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'admin@rasha.com') {
      setUser({ name: 'المسؤول العام', role: 'admin', email: email });
      notify('أهلاً بك يا مدير النظام! ⚙️');
      setView('shop');
    } else {
      setUser({ name: name || 'زبون مميز', role: 'retail_customer', email: email });
      notify('تم تسجيل الدخول بنجاح ✅');
      setView('shop');
    }
  };

  const handleLogout = () => { setUser(null); notify('تم تسجيل الخروج 👋'); setView('shop'); };
  const toggleFavorite = (id) => { setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]); notify(favorites.includes(id) ? 'أزيل من المفضلة' : 'أضيف إلى المفضلة ❤'); };
  const isPackage = (p) => p.category?.name === 'بكجات الهدايا';
  const individualPerfumes = products.filter(p => !['مكياج', 'بكجات الهدايا'].includes(p.category?.name));

  const addToCart = (product, variant = product.variants[0], amount = qty) => {
    const picks = isPackage(product) ? Object.values(packageSelections[product.id] || {}).filter(Boolean) : [];
    if (isPackage(product) && picks.length < 2) { notify('اختر العطرين أولاً لإضافة البكج'); return false; }
    const id = `${product.id}-${variant.id}-${picks.join('|')}`;
    setCart(c => {
      const i = c.findIndex(x => x.id === id);
      if (i > -1) return c.map((x, k) => k === i ? { ...x, quantity: x.quantity + amount } : x);
      return [...c, { id, product_id: product.id, name: product.name, image: product.image, size: variant.size, price: variant.retail_price, quantity: amount, packageItems: picks }];
    });
    notify('أضيف إلى السلة 🛒');
    return true;
  };

  const changeQty = (id, d) => setCart(c => c.map(x => x.id === id ? { ...x, quantity: Math.max(1, x.quantity + d) } : x));
  const removeItem = (id) => setCart(c => c.filter(x => x.id !== id));
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  // دالة الإجبار على تسجيل الدخول قبل إتمام الطلب
  const enforceCheckout = () => {
    if (!user) {
      setCartOpen(false);
      notify('يرجى تسجيل الدخول أولاً لإتمام طلبك 🔒');
      setAuthMode('login');
      setView('auth');
    } else {
      setCartOpen(false);
      setView('checkout');
    }
  };

  // تقديم الطلب للمستخدم
  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!cart.length) return notify('السلة فارغة');
    const newOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: user.name,
      email: user.email, // ربط الطلب بإيميل اليوزر
      phone: shippingPhone,
      total: cartTotal,
      status: 'قيد المراجعة',
      items: cart.map(i => `${i.name} (${i.quantity})`).join(' + '),
      date: new Date().toLocaleDateString('ar-EG')
    };
    setOrders([newOrder, ...orders]); // حفظ الطلب
    setTimeout(() => { setCart([]); setView('success'); }, 800);
  };

  // وظائف الأدمن
  const handleAddProduct = (e) => {
    e.preventDefault();
    const imgPath = newProductImage.startsWith('http') ? newProductImage : PI(newProductImage || 'leader.jpg');
    const newProd = {
      id: `custom-${Date.now()}`, name: newProductName, description: newProductDesc,
      image: imgPath, gallery: [imgPath], category: { name: newProductCategory }, brand: { name: 'RASHA VIP' },
      badge: 'جديد الأدمن', rating: 5, variants: [{ id: Date.now(), size: 'قياسي', retail_price: parseFloat(newProductPrice) || 25 }]
    };
    setProducts([newProd, ...products]);
    setNewProductName(''); setNewProductDesc(''); setNewProductPrice(''); setNewProductImage('');
    notify('تم إضافة ونشر المنتج بنجاح! سيراه جميع المستخدمين الآن.');
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) {
      setProducts(products.filter(p => p.id !== productId));
      notify('تم حذف المنتج بنجاح من المتجر.');
    }
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    notify(`تم تحديث حالة الطلب إلى (${newStatus}). سيراها المستخدم في حسابة.`);
  };

  const openProduct = (p) => { setSelectedProduct(p); setActiveImageIndex(0); setQty(1); };
  const goCategory = (cat) => { setSelectedCategory(cat); setView('shop'); setMenuOpen(false); setTimeout(() => document.getElementById('all-products')?.scrollIntoView({ behavior: 'smooth' }), 80); };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = products.filter(p => (p.name.toLowerCase().includes(q) || p.brand?.name.toLowerCase().includes(q)) && (selectedCategory === 'all' || p.category?.name === selectedCategory));
    if (sortBy === 'low') list = [...list].sort((a, b) => a.variants[0].retail_price - b.variants[0].retail_price);
    if (sortBy === 'high') list = [...list].sort((a, b) => b.variants[0].retail_price - a.variants[0].retail_price);
    return list;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const bestSellers = useMemo(() => [...products].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 10), [products]);
  const favProducts = useMemo(() => products.filter(p => favorites.includes(p.id)), [products, favorites]);
  const userOrders = useMemo(() => orders.filter(o => o.email === user?.email), [orders, user]);
  const scrollBest = (d) => bestRef.current?.scrollBy({ left: d * 320, behavior: 'smooth' });

  const ProductCard = ({ p }) => {
    const v = p.variants[0];
    const fav = favorites.includes(p.id);
    return (
      <article className="product-card">
        <div className="pc-media">
          {p.badge && <span className="pc-badge">{p.badge}</span>}
          <img src={p.image || placeholder(p.name, p.brand?.name)} alt={p.name} loading="lazy" onClick={() => openProduct(p)} onError={imgFail(p)} />
          <div className="pc-actions">
            <button aria-label="عرض سريع" onClick={() => openProduct(p)}><Icon d={ICONS.eye} size={20} /></button>
            <button aria-label="المفضلة" className={fav ? 'on' : ''} onClick={() => toggleFavorite(p.id)}><Icon d={ICONS.heart} size={20} /></button>
          </div>
          <button className="pc-add" onClick={() => (isPackage(p) ? openProduct(p) : addToCart(p, v))}>
            <Icon d={ICONS.bag} size={18} /> {isPackage(p) ? 'اختر العطور' : 'أضف إلى السلة'}
          </button>
        </div>
        <div className="pc-body">
          <h3 onClick={() => openProduct(p)}>{p.name}</h3>
          {p.rating && <div className="pc-rate"><Stars n={p.rating} /><small>({p.reviewsCount})</small></div>}
          <div className="pc-price">
            <strong>{fmt(v.retail_price)} <em>د.أ</em></strong>
            {p.oldPrice && <del>{fmt(p.oldPrice)}</del>}
          </div>
        </div>
      </article>
    );
  };

  const navLinks = [
    { c: 'all', l: 'الكل' },
    { c: 'عطور رجالية', l: 'عطور رجالية' }, { c: 'عطور نسائية', l: 'عطور نسائية' },
    { c: 'للجنسين', l: 'للجنسين' }, { c: 'بكجات الهدايا', l: 'بكجات الهدايا' }, { c: 'مكياج', l: 'قسم المكياج' }
  ];

  return (
    <div className="app" dir="rtl">
      <div className="topbar">
        <div className="marquee">
          {Array.from({ length: 8 }).map((_, i) => <span key={i}>توصيل لجميع محافظات الأردن &nbsp;&bull;&nbsp; دفع عند الاستلام &nbsp;&bull;&nbsp; أصلي 100% &nbsp;&bull;&nbsp;</span>)}
        </div>
      </div>

      <header className="header">
        <div className="header-main">
          <button className="icon-btn menu-btn" onClick={() => setMenuOpen(o => !o)}><Icon d={menuOpen ? ICONS.close : ICONS.menu} /></button>
          <div className="logo" onClick={() => { setView('shop'); setSelectedCategory('all'); }}>
            <span className="logo-mark">R</span>
            <span className="logo-text"><b>Rasha</b><small>عطور ومكياج</small></span>
          </div>
          <nav className={`nav ${menuOpen ? 'open' : ''}`}>
            {navLinks.map(n => <button key={n.c} className={selectedCategory === n.c && view === 'shop' ? 'active' : ''} onClick={() => goCategory(n.c)}>{n.l}</button>)}
          </nav>
          <div className="header-icons">
            <button className="icon-btn" onClick={() => setSearchOpen(o => !o)}><Icon d={ICONS.search} /></button>
            <button className="icon-btn" onClick={() => setView('favorites')}><Icon d={ICONS.heart} />{favorites.length > 0 && <span className="badge">{favorites.length}</span>}</button>
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <button onClick={() => setView('admin')} style={{ background: '#fbbf24', color: '#111', fontWeight: 'bold', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', margin: '0 5px' }}>⚙ الأدمن</button>
                ) : (
                  <button className="user-chip" onClick={() => setView('my-orders')} style={{ margin: '0 5px', fontWeight: 'bold' }}>📦 طلباتي</button>
                )}
                <button className="icon-btn" onClick={handleLogout} title="تسجيل الخروج" style={{ color: 'red' }}><Icon d={ICONS.close} size={18} /></button>
              </>
            ) : (
              <button className="icon-btn" onClick={() => { setAuthMode('login'); setView('auth'); }}><Icon d={ICONS.user} /></button>
            )}
            <button className="icon-btn" onClick={() => setCartOpen(true)}><Icon d={ICONS.bag} /><span className="badge">{cart.length}</span></button>
          </div>
        </div>
        {searchOpen && (
          <div className="search-panel">
            <input autoFocus placeholder="ابحث عن عطر أو ماركة..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setView('shop'); }} />
            {searchQuery && <button onClick={() => setSearchQuery('')}>مسح</button>}
          </div>
        )}
      </header>

      {toast && <div className="toast" role="status">{toast}</div>}

      {/* لوحة تحكم الأدمن */}
      {view === 'admin' && user?.role === 'admin' && (
        <div style={{ padding: '40px 20px', maxWidth: '1100px', margin: '0 auto', color: '#fff' }}>
          <h1 style={{ color: '#fbbf24', marginBottom: '15px' }}>⚙️ لوحة تحكم المسؤول</h1>
          
          <div style={{ background: '#1e293b', padding: '25px', borderRadius: '12px', marginBottom: '40px', border: '1px solid rgba(251,191,36,0.3)' }}>
            <h3 style={{ color: '#fbbf24', marginBottom: '15px' }}>➕ إضافة منتج جديد</h3>
            <form onSubmit={handleAddProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <input type="text" placeholder="اسم المنتج" value={newProductName} onChange={e => setNewProductName(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', background: '#0f172a', color: '#fff', border: '1px solid #444' }} />
              <input type="number" placeholder="السعر (د.أ)" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', background: '#0f172a', color: '#fff', border: '1px solid #444' }} />
              <input type="text" placeholder="اسم الصورة (مثل: leader.jpg)" value={newProductImage} onChange={e => setNewProductImage(e.target.value)} style={{ padding: '12px', borderRadius: '8px', background: '#0f172a', color: '#fff', border: '1px solid #444' }} />
              <select value={newProductCategory} onChange={e => setNewProductCategory(e.target.value)} style={{ padding: '12px', borderRadius: '8px', background: '#0f172a', color: '#fff', border: '1px solid #444' }}>
                <option value="مكياج">مكياج</option>
                <option value="عطور رجالية">عطور رجالية</option>
                <option value="عطور نسائية">عطور نسائية</option>
                <option value="بكجات الهدايا">بكجات الهدايا</option>
              </select>
              <input type="text" placeholder="وصف المنتج..." value={newProductDesc} onChange={e => setNewProductDesc(e.target.value)} required style={{ gridColumn: 'span 2', padding: '12px', borderRadius: '8px', background: '#0f172a', color: '#fff', border: '1px solid #444' }} />
              <button type="submit" style={{ gridColumn: 'span 2', padding: '14px', background: '#fbbf24', color: '#111', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>نشر المنتج لجميع الزوار</button>
            </form>
          </div>

          <h3 style={{ color: '#34d399', marginBottom: '15px' }}>📦 طلبات الزبائن (تغيير الحالة يظهر للزبون فوراً)</h3>
          <div style={{ background: '#1e293b', padding: '25px', borderRadius: '12px', marginBottom: '40px', border: '1px solid rgba(52,211,153,0.3)' }}>
            {orders.length === 0 ? <p>لا توجد طلبات بعد.</p> : orders.map(ord => (
              <div key={ord.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #334155' }}>
                <div>
                  <strong style={{ color: '#fbbf24' }}>{ord.id}</strong> - {ord.customer} ({ord.email}) - <span style={{ color: '#f87171' }}>{ord.total} د.أ</span>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>المنتجات: {ord.items}</div>
                </div>
                <select value={ord.status} onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', background: '#0f172a', color: '#34d399', border: '1px solid #34d399', fontWeight: 'bold' }}>
                  <option value="قيد المراجعة">قيد المراجعة</option>
                  <option value="جاري التجهيز">جاري التجهيز</option>
                  <option value="تم الشحن">تم الشحن 🚚</option>
                  <option value="تم التوصيل بنجاح">تم التوصيل بنجاح ✓</option>
                </select>
              </div>
            ))}
          </div>

          <h3 style={{ color: '#f87171', marginBottom: '15px' }}>🗑️ إدارة وحذف المنتجات</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
            {products.map(prod => (
              <div key={prod.id} style={{ background: '#1e293b', padding: '12px', borderRadius: '10px', border: '1px solid #334155' }}>
                <img src={prod.image} alt={prod.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }} onError={imgFail(prod)} />
                <h4 style={{ fontSize: '14px', margin: '0 0 8px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.name}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#f87171', fontWeight: 'bold' }}>{fmt(prod.variants[0].retail_price)} د.أ</span>
                  <button onClick={() => handleDeleteProduct(prod.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>حذف</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* صفحة طلباتي للمستخدم العادي */}
      {view === 'my-orders' && user?.role !== 'admin' && (
        <main className="container page narrow">
          <h1 className="page-title">📦 طلباتي السابقة</h1>
          {userOrders.length === 0 ? (
            <div className="empty">
              <p>لم تقم بإجراء أي طلبات بعد.</p>
              <button className="btn-gold" onClick={() => setView('shop')}>تسوق الآن</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {userOrders.map(ord => (
                <div key={ord.id} style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                    <b style={{ color: '#98793f' }}>رقم الطلب: {ord.id}</b>
                    <span style={{ color: '#888', fontSize: '13px' }}>{ord.date}</span>
                  </div>
                  <p style={{ margin: '5px 0', color: '#444' }}><b>المنتجات:</b> {ord.items}</p>
                  <p style={{ margin: '5px 0', color: '#444' }}><b>الإجمالي:</b> {ord.total} د.أ</p>
                  <div style={{ marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <b>حالة الطلب الحالية:</b> 
                    <span style={{ color: ord.status.includes('تم') ? '#10b981' : '#f59e0b', fontWeight: 'bold', fontSize: '15px' }}>{ord.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {view === 'shop' && (
        <main>
          <section className="hero">
            {slides.map((s, i) => (
              <div key={i} className={`hero-slide ${i === currentSlide ? 'active' : ''}`} style={{ backgroundImage: `url('${s.image}')` }}>
                <div className="hero-copy">
                  <h1>{s.title}</h1>
                  <p>{s.subtitle}</p>
                  <button className="btn-gold" onClick={() => goCategory(s.cat)}>تسوق الآن</button>
                </div>
              </div>
            ))}
          </section>

          <section className="container" id="all-products">
            <div className="sec-head">
              <h2 className="sec-title">{selectedCategory === 'all' ? 'جميع العطور والبوكسات' : selectedCategory} <small>({filteredProducts.length})</small></h2>
            </div>
            <div className="chips">
              {navLinks.map(n => <button key={n.c} className={selectedCategory === n.c ? 'on' : ''} onClick={() => setSelectedCategory(n.c)}>{n.l}</button>)}
            </div>
            {filteredProducts.length === 0 ? (
              <div className="empty">لا توجد نتائج مطابقة.</div>
            ) : (
              <div className="grid">{filteredProducts.map(p => <div key={p.id} className="cell"><ProductCard p={p} /></div>)}</div>
            )}
          </section>
        </main>
      )}

      {view === 'auth' && (
        <main className="auth">
          <div className="auth-card">
            <div className="tabs">
              <button className={authMode === 'login' ? 'on' : ''} onClick={() => setAuthMode('login')}>تسجيل الدخول</button>
              <button className={authMode === 'register' ? 'on' : ''} onClick={() => setAuthMode('register')}>حساب جديد</button>
            </div>
            <h2>{authMode === 'login' ? 'أهلاً بعودتك' : 'أنشئ حسابك'}</h2>
            <p style={{ fontSize: '12px', color: '#fbbf24', margin: '5px 0' }}>💡 حساب أدمن: admin@rasha.com | يوزر عادي: أي إيميل آخر</p>
            <form onSubmit={handleLogin}>
              {authMode === 'register' && <label>الاسم الكامل<input value={name} onChange={e => setName(e.target.value)} required /></label>}
              <label>البريد الإلكتروني<input type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} required /></label>
              <label>كلمة المرور<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
              <button className="btn-gold full" type="submit">{authMode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}</button>
            </form>
          </div>
        </main>
      )}

      {view === 'cart' && (
        <main className="container page">
          <h1 className="page-title">سلة المشتريات</h1>
          {!cart.length ? (
            <div className="empty"><p className="muted">السلة فارغة</p><button className="btn-gold" onClick={() => setView('shop')}>تسوق</button></div>
          ) : (
            <div className="cart-page">
              {cart.map(i => (
                <div key={i.id} className="cart-row">
                  <img src={i.image} alt={i.name} onError={imgFail(i)} />
                  <div className="cp-info"><b>{i.name}</b><small>{i.size}</small><b>{fmt(i.price)} د.أ</b></div>
                  <div className="qty sm"><button onClick={() => changeQty(i.id, -1)}>-</button><span>{i.quantity}</span><button onClick={() => changeQty(i.id, 1)}>+</button></div>
                  <strong>{fmt(i.price * i.quantity)} د.أ</strong>
                  <button className="rm" onClick={() => removeItem(i.id)}>✕</button>
                </div>
              ))}
              <div className="cart-sum"><span>المجموع:</span><b>{fmt(cartTotal)} د.أ</b><button className="btn-gold" onClick={enforceCheckout}>إتمام الطلب</button></div>
            </div>
          )}
        </main>
      )}

      {view === 'checkout' && (
        <main className="container page narrow">
          <h1 className="page-title">إتمام الطلب</h1>
          <form className="checkout" onSubmit={handleCheckoutSubmit}>
            <label>عنوان الشحن<input placeholder="المدينة، الشارع" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} required /></label>
            <label>رقم الهاتف<input inputMode="tel" placeholder="079xxxxxxx" value={shippingPhone} onChange={e => setShippingPhone(e.target.value)} required /></label>
            <div className="cart-sum"><span>الإجمالي:</span><b>{fmt(cartTotal)} د.أ</b></div>
            <button className="btn-gold full" type="submit">تأكيد الطلب</button>
          </form>
        </main>
      )}

      {view === 'success' && (
        <main className="container page narrow center">
          <div className="success-mark">✓</div>
          <h1 className="page-title">تم استلام طلبك!</h1>
          <p className="muted">تم تحويل الطلب للأدمن، يمكنك متابعة حالة طلبك من زر "طلباتي" في الأعلى.</p>
          <button className="btn-gold" onClick={() => setView('my-orders')}>عرض طلباتي</button>
        </main>
      )}

      {cartOpen && (
        <>
          <div className="overlay" onClick={() => setCartOpen(false)} />
          <aside className="drawer">
            <div className="drawer-head"><h3>السلة ({cart.length})</h3><button className="icon-btn" onClick={() => setCartOpen(false)}><Icon d={ICONS.close} /></button></div>
            <div className="drawer-body">
              {!cart.length ? <p className="muted">السلة فارغة</p> : cart.map(i => (
                <div key={i.id} className="cart-row">
                  <img src={i.image} alt={i.name} onError={imgFail(i)} />
                  <div className="cp-info"><b>{i.name}</b><small>{i.size}</small><b>{fmt(i.price)} د.أ</b></div>
                  <div className="qty sm"><button onClick={() => changeQty(i.id, -1)}>-</button><span>{i.quantity}</span><button onClick={() => changeQty(i.id, 1)}>+</button></div>
                  <button className="rm" onClick={() => removeItem(i.id)}>✕</button>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="drawer-foot">
                <div className="cart-sum"><span>المجموع</span><b>{fmt(cartTotal)} د.أ</b></div>
                <button className="btn-gold full" onClick={enforceCheckout}>إتمام الطلب</button>
              </div>
            )}
          </aside>
        </>
      )}

      {selectedProduct && (
        <div className="modal-wrap" onClick={() => setSelectedProduct(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setSelectedProduct(null)}><Icon d={ICONS.close} size={20} /></button>
            <div className="m-gallery"><img src={selectedProduct.image} alt={selectedProduct.name} onError={imgFail(selectedProduct)} /></div>
            <div className="m-info">
              <h2>{selectedProduct.name}</h2>
              <div className="m-price"><strong>{fmt(selectedProduct.variants[0].retail_price)} <em>د.أ</em></strong></div>
              <p className="m-desc">{selectedProduct.description}</p>
              <div className="m-buy">
                <div className="qty"><button onClick={() => setQty(q => Math.max(1, q - 1))}>-</button><span>{qty}</span><button onClick={() => setQty(q => q + 1)}>+</button></div>
                <button className="btn-outline grow" onClick={() => { addToCart(selectedProduct, selectedProduct.variants[0], qty); setSelectedProduct(null); }}>أضف إلى السلة</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;