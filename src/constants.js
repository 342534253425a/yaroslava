export const PRODUCT_STATUS = {
  available: 'В наличии',
  reserved: 'Забронировано',
  sold: 'Продано',
  repeat: 'Повторю на заказ',
};

export const CATEGORIES = ['Кружево', 'Свитеры и джемперы', 'Платья и юбки', 'Брюки и шорты', 'Аксессуары'];

export const SHAPES = {
  sweater: 'Свитер',
  cardigan: 'Кардиган',
  dress: 'Платье',
  skirt: 'Юбка',
  top: 'Топ',
  pants: 'Брюки',
  shorts: 'Шорты',
  shawl: 'Шаль',
  rose: 'Кружевной мотив',
  yarn: 'Пряжа',
};

export const LEVELS = ['Начальный', 'Средний', 'Продвинутый'];

export const REQUEST_STATUS = [
  ['new', 'Новая заявка'],
  ['contacted', 'Связались'],
  ['discussion', 'Обсуждение'],
  ['agreed', 'Согласован'],
  ['in_work', 'В работе'],
  ['ready', 'Готов'],
  ['done', 'Завершён'],
  ['cancelled', 'Отменён'],
];

export const ORDER_STATUS = [
  ['new', 'Новый'],
  ['awaiting_payment', 'Ожидает оплаты'],
  ['paid', 'Оплачен'],
  ['shipped', 'Отправлен'],
  ['done', 'Завершён'],
  ['cancelled', 'Отменён'],
];

export const label = (pairs, key) => (pairs.find(([k]) => k === key) || [key, key])[1];

export const ITEMS = [
  { id: 'skirt', label: 'Юбка', shape: 'skirt' },
  { id: 'dress', label: 'Платье', shape: 'dress' },
  { id: 'jumper', label: 'Джемпер', shape: 'sweater' },
  { id: 'sweater', label: 'Свитер', shape: 'sweater' },
  { id: 'cardigan', label: 'Кардиган', shape: 'cardigan' },
  { id: 'top', label: 'Топ', shape: 'top' },
  { id: 'pants', label: 'Брюки', shape: 'pants' },
  { id: 'shorts', label: 'Шорты', shape: 'shorts' },
  { id: 'shawl', label: 'Шаль / палантин', shape: 'shawl' },
  { id: 'lace', label: 'Кружевное изделие', shape: 'rose' },
  { id: 'other', label: 'Другое', shape: 'yarn' },
];

export const SHAPE_TO_ITEM = {
  sweater: 'sweater', cardigan: 'cardigan', dress: 'dress', skirt: 'skirt', top: 'top',
  pants: 'pants', shorts: 'shorts', shawl: 'shawl', rose: 'lace', yarn: 'other',
};

export const YARNS = [
  { id: 'merino', name: 'Меринос', composition: '100% шерсть мериноса', season: 'Осень — зима', density: 'Средняя', soft: 5, warm: 4, note: 'Не колется и мягко держит форму' },
  { id: 'cotton', name: 'Хлопок', composition: '100% хлопок', season: 'Весна — лето', density: 'Средняя', soft: 3, warm: 2, note: 'Дышит и приятно холодит кожу' },
  { id: 'linen', name: 'Лён с хлопком', composition: '55% лён, 45% хлопок', season: 'Лето', density: 'Лёгкая', soft: 2, warm: 1, note: 'Фактурный, с каждой стиркой мягче' },
  { id: 'mohair', name: 'Мохер с шёлком', composition: '70% кид-мохер, 30% шёлк', season: 'Круглый год', density: 'Невесомая', soft: 5, warm: 4, note: 'Воздушный ореол для кружев и многослойности' },
  { id: 'alpaca', name: 'Альпака', composition: '80% альпака, 20% шерсть', season: 'Зима', density: 'Плотная', soft: 4, warm: 5, note: 'Очень тёплая и при этом лёгкая' },
  { id: 'lace-cotton', name: 'Кружевной хлопок', composition: '100% мерсеризованный хлопок', season: 'Круглый год', density: 'Тонкая', soft: 3, warm: 1, note: 'Для ирландского кружева: чёткий рельеф и мягкий блеск' },
  { id: 'cashmere', name: 'Кашемир', composition: '100% кашемир', season: 'Осень — зима', density: 'Лёгкая', soft: 5, warm: 5, note: 'Самая нежная пряжа для особенных вещей' },
  { id: 'advice', name: 'Посоветуйте мне', composition: 'Подберём вместе', season: '—', density: '—', soft: 0, warm: 0, note: 'Ярослава предложит пряжу под ваш фасон и задачу' },
];

export const COLORS = [
  ['Бордо', '#6E0F1E'], ['Гранат', '#9B1B30'], ['Винный', '#4E0B16'], ['Пудровый', '#D9B8B0'],
  ['Молочный', '#F1E9DD'], ['Слоновая кость', '#E6DCC6'], ['Беж', '#CDB79E'], ['Карамель', '#B07A4F'],
  ['Шалфей', '#9BA58C'], ['Небесный', '#A9BCC9'], ['Графит', '#3E3B3C'], ['Чёрный', '#141112'],
];

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const MEASURES = [
  ['height', 'Рост'], ['chest', 'Обхват груди'], ['waist', 'Обхват талии'],
  ['hips', 'Обхват бёдер'], ['length', 'Длина изделия'], ['sleeve', 'Длина рукава'],
];

export const FITS = ['Облегающая', 'Полуприлегающая', 'Свободная', 'Оверсайз'];

export const REF_TAGS = [['item', 'Вещь, которая нравится'], ['style', 'Пример фасона'], ['pattern', 'Узор']];

export const CHANNELS = [['telegram', 'Telegram'], ['max', 'MAX']];

export const DELIVERY = [['cdek', 'СДЭК'], ['post', 'Почта России'], ['pickup', 'Самовывоз']];
