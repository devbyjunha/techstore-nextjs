import { Product } from '@/types';

export const products: Product[] = [
  // Talon PoC: C1 임계값(50,000원) 미만 테스트용 저가 상품
  {
    id: '35',
    name: 'USB-C 고속 충전 케이블 (1m)',
    description: 'Talon PoC용 저가 상품. 장바구니 합계 5만원 미만 할인 미적용 테스트에 사용합니다.',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&h=500&fit=crop&crop=center',
    category: '액세서리',
    rating: 4.3,
    reviews: 812
  },
  {
    id: '36',
    name: '실리콘 폰 케이스',
    description: '기본형 실리콘 케이스. 5만원 미만 카트 테스트용 저가 상품입니다.',
    price: 19000,
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500&h=500&fit=crop&crop=center',
    category: '액세서리',
    rating: 4.2,
    reviews: 534
  },
  {
    id: '37',
    name: '무선 마우스 패드',
    description: '미끄럼 방지 마우스 패드. C1 캠페인 임계값 미만 시나리오용입니다.',
    price: 15000,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop&crop=center',
    category: '액세서리',
    rating: 4.1,
    reviews: 298
  },
  {
    id: '38',
    name: '케이블 정리 클립 세트',
    description: '데스크 케이블 정리용 클립 6개 세트. 합계 5만원 미만 테스트에 적합합니다.',
    price: 8900,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop&crop=center',
    category: '액세서리',
    rating: 4.0,
    reviews: 167
  },
  {
    id: '1',
    name: 'MacBook Pro 14"',
    description: 'Apple M3 Pro 칩을 탑재한 최신 MacBook Pro. 전문가급 성능과 휴대성을 제공합니다.',
    price: 2990000,
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&h=500&fit=crop&crop=center',
    category: '노트북',
    rating: 4.8,
    reviews: 1247
  },
  {
    id: '2',
    name: 'iPhone 15 Pro',
    description: 'A17 Pro 칩과 티타늄 디자인으로 완벽한 성능을 제공하는 최신 iPhone.',
    price: 1550000,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=500&fit=crop&crop=center',
    category: '스마트폰',
    rating: 4.7,
    reviews: 892
  },
  {
    id: '3',
    name: 'AirPods Pro 2세대',
    description: '액티브 노이즈 캔슬링과 공간 음향을 지원하는 프리미엄 무선 이어폰.',
    price: 299000,
    originalPrice: 359000,
    discount: 17,
    isOnSale: true,
    image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500&h=500&fit=crop&crop=center',
    category: '액세서리',
    rating: 4.6,
    reviews: 567
  },
  {
    id: '4',
    name: 'iPad Air 5세대',
    description: 'M1 칩을 탑재한 가벼운 태블릿으로 창작 작업에 최적화.',
    price: 799000,
    originalPrice: 899000,
    discount: 11,
    isOnSale: true,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop&crop=center',
    category: '태블릿',
    rating: 4.5,
    reviews: 423
  },
  {
    id: '5',
    name: 'Apple Watch Series 9',
    description: '건강 모니터링과 피트니스 추적 기능이 강화된 스마트워치.',
    price: 599000,
    image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500&h=500&fit=crop&crop=center',
    category: '액세서리',
    rating: 4.4,
    reviews: 298
  },
  {
    id: '6',
    name: 'Mac Studio',
    description: 'M2 Ultra 칩을 탑재한 전문가용 데스크톱 컴퓨터.',
    price: 4990000,
    image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=500&h=500&fit=crop&crop=center',
    category: '노트북',
    rating: 4.9,
    reviews: 156
  },
  {
    id: '7',
    name: 'HomePod mini',
    description: 'Siri를 탑재한 스마트 스피커로 음악과 홈 자동화를 제어.',
    price: 99000,
    originalPrice: 129000,
    discount: 23,
    isOnSale: true,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop&crop=center',
    category: '액세서리',
    rating: 4.3,
    reviews: 234
  },
  {
    id: '8',
    name: 'Magic Keyboard',
    description: '정밀한 키감과 편안한 타이핑을 제공하는 무선 키보드.',
    price: 119000,
    originalPrice: 159000,
    discount: 25,
    isOnSale: true,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&h=500&fit=crop&crop=center',
    category: '액세서리',
    rating: 4.2,
    reviews: 189
  },
  // 노트북 카테고리 추가 상품
  {
    id: '9',
    name: 'MacBook Air 13" M2',
    description: 'M2 칩을 탑재한 얇고 가벼운 노트북으로 일상 업무에 최적화.',
    price: 1690000,
    originalPrice: 1990000,
    discount: 15,
    isOnSale: true,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop&crop=center',
    category: '노트북',
    rating: 4.7,
    reviews: 892
  },
  {
    id: '10',
    name: 'Samsung Galaxy Book3 Pro',
    description: '13세대 Intel Core 프로세서와 AMOLED 디스플레이를 탑재한 프리미엄 노트북.',
    price: 1890000,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop&crop=center',
    category: '노트북',
    rating: 4.5,
    reviews: 456
  },
  {
    id: '11',
    name: 'LG Gram 17',
    description: '1.35kg의 초경량 17인치 노트북으로 휴대성과 화면 크기를 모두 만족.',
    price: 2190000,
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&h=500&fit=crop&crop=center',
    category: '노트북',
    rating: 4.4,
    reviews: 234
  },
  // 스마트폰 카테고리 추가 상품
  {
    id: '12',
    name: 'iPhone 15',
    description: 'A16 바이오닉 칩과 48MP 메인 카메라를 탑재한 최신 iPhone.',
    price: 1250000,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=500&fit=crop&crop=center',
    category: '스마트폰',
    rating: 4.6,
    reviews: 1234
  },
  {
    id: '13',
    name: 'Samsung Galaxy S24 Ultra',
    description: 'S Pen과 200MP 카메라를 탑재한 프리미엄 안드로이드 스마트폰.',
    price: 1890000,
    originalPrice: 2190000,
    discount: 14,
    isOnSale: true,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop&crop=center',
    category: '스마트폰',
    rating: 4.8,
    reviews: 987
  },
  {
    id: '14',
    name: 'Google Pixel 8 Pro',
    description: 'Google Tensor G3 칩과 AI 기능이 강화된 안드로이드 스마트폰.',
    price: 1290000,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop&crop=center',
    category: '스마트폰',
    rating: 4.5,
    reviews: 567
  },
  // 태블릿 카테고리 추가 상품
  {
    id: '15',
    name: 'iPad Pro 12.9" M2',
    description: 'M2 칩과 Liquid Retina XDR 디스플레이를 탑재한 프로급 태블릿.',
    price: 1399000,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop&crop=center',
    category: '태블릿',
    rating: 4.9,
    reviews: 456
  },
  {
    id: '16',
    name: 'Samsung Galaxy Tab S9 Ultra',
    description: '14.6인치 대형 화면과 S Pen을 지원하는 프리미엄 안드로이드 태블릿.',
    price: 1299000,
    originalPrice: 1499000,
    discount: 13,
    isOnSale: true,
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=500&h=500&fit=crop&crop=center',
    category: '태블릿',
    rating: 4.6,
    reviews: 234
  },
  {
    id: '17',
    name: 'iPad mini 6세대',
    description: 'A15 바이오닉 칩을 탑재한 컴팩트한 태블릿으로 휴대성에 최적화.',
    price: 649000,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop&crop=center',
    category: '태블릿',
    rating: 4.4,
    reviews: 345
  },
  // 액세서리 카테고리 추가 상품
  {
    id: '18',
    name: 'AirPods Max',
    description: '고음질과 액티브 노이즈 캔슬링을 제공하는 오버이어 헤드폰.',
    price: 699000,
    originalPrice: 799000,
    discount: 13,
    isOnSale: true,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop&crop=center',
    category: '액세서리',
    rating: 4.5,
    reviews: 678
  },
  {
    id: '19',
    name: 'Magic Mouse',
    description: '멀티터치 제스처와 무선 충전을 지원하는 프리미엄 마우스.',
    price: 99000,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop&crop=center',
    category: '액세서리',
    rating: 4.3,
    reviews: 234
  },
  {
    id: '20',
    name: 'Apple Pencil 2세대',
    description: 'iPad Pro와 호환되는 정밀한 디지털 펜으로 창작 작업에 최적화.',
    price: 179000,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop&crop=center',
    category: '액세서리',
    rating: 4.7,
    reviews: 456
  },
  {
    id: '21',
    name: 'Samsung Galaxy Buds2 Pro',
    description: '24bit 고음질과 액티브 노이즈 캔슬링을 지원하는 무선 이어폰.',
    price: 249000,
    originalPrice: 299000,
    discount: 17,
    isOnSale: true,
    image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500&h=500&fit=crop&crop=center',
    category: '액세서리',
    rating: 4.4,
    reviews: 345
  },
  {
    id: '22',
    name: 'Sony WH-1000XM5',
    description: '업계 최고 수준의 노이즈 캔슬링과 30시간 배터리를 제공하는 헤드폰.',
    price: 499000,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop&crop=center',
    category: '액세서리',
    rating: 4.8,
    reviews: 789
  },
  // 전기차 카테고리
  {
    id: '23',
    name: 'Tesla Model 3',
    description: 'Tesla의 베스트셀러 전기 세단. 491km 주행거리와 Autopilot을 기본 제공합니다.',
    price: 52990000,
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=500&h=500&fit=crop&crop=center',
    category: '전기차',
    rating: 4.7,
    reviews: 3421
  },
  {
    id: '24',
    name: 'Tesla Model Y',
    description: 'Tesla의 컴팩트 SUV. 넓은 실내 공간과 511km 주행거리로 가족용 EV에 최적화.',
    price: 58990000,
    originalPrice: 62990000,
    discount: 6,
    isOnSale: true,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&h=500&fit=crop&crop=center',
    category: '전기차',
    rating: 4.8,
    reviews: 2876
  },
  {
    id: '25',
    name: 'Volvo EX30',
    description: 'Volvo의 소형 프리미엄 EV. 480km 주행거리와 스칸디나비아 디자인을 갖춘 도심형 SUV.',
    price: 55900000,
    image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=500&h=500&fit=crop&crop=center',
    category: '전기차',
    rating: 4.6,
    reviews: 892
  },
  {
    id: '26',
    name: 'Volvo EX90',
    description: 'Volvo 플래그십 7인승 전기 SUV. LiDAR 기반 안전 시스템과 600km 주행거리.',
    price: 109900000,
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=500&h=500&fit=crop&crop=center',
    category: '전기차',
    rating: 4.9,
    reviews: 456
  },
  {
    id: '27',
    name: 'BYD Atto 3',
    description: 'BYD의 컴팩트 전기 SUV. Blade Battery 기술과 420km 주행거리로 가성비를 자랑합니다.',
    price: 44900000,
    originalPrice: 47900000,
    discount: 6,
    isOnSale: true,
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&h=500&fit=crop&crop=center',
    category: '전기차',
    rating: 4.5,
    reviews: 1234
  },
  {
    id: '28',
    name: 'BYD Seal',
    description: 'BYD의 프리미엄 전기 세단. 650km 주행거리와 CTB 배터리 일체형 기술을 적용.',
    price: 52900000,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&h=500&fit=crop&crop=center',
    category: '전기차',
    rating: 4.6,
    reviews: 678
  },
  {
    id: '29',
    name: 'Zeekr 001',
    description: 'Geely 프리미엄 브랜드 Zeekr의 슈팅브레이크 EV. 705km 주행거리와 3.8초 0-100km/h.',
    price: 69900000,
    image: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=500&h=500&fit=crop&crop=center',
    category: '전기차',
    rating: 4.7,
    reviews: 534
  },
  {
    id: '30',
    name: 'Zeekr X',
    description: 'Zeekr의 컴팩트 프리미엄 EV. 도심 주행에 최적화된 440km 주행거리와 빠른 충전.',
    price: 48900000,
    originalPrice: 51900000,
    discount: 6,
    isOnSale: true,
    image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=500&h=500&fit=crop&crop=center',
    category: '전기차',
    rating: 4.5,
    reviews: 312
  },
  {
    id: '31',
    name: '현대 아이오닉 5',
    description: '현대자동차 E-GMP 플랫폼 기반 전기 SUV. 800V 초고속 충전과 458km 주행거리.',
    price: 52000000,
    image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=500&h=500&fit=crop&crop=center',
    category: '전기차',
    rating: 4.8,
    reviews: 4567
  },
  {
    id: '32',
    name: '현대 아이오닉 6',
    description: '현대의 스트림라이너 디자인 전기 세단. 524km 주행거리와 세계 최고 수준의 공기역학.',
    price: 52800000,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&h=500&fit=crop&crop=center',
    category: '전기차',
    rating: 4.7,
    reviews: 2345
  },
  {
    id: '33',
    name: '기아 EV6',
    description: '기아의 전기 크로스오버. 800V 충전, 475km 주행거리, GT 모드 3.5초 가속.',
    price: 51900000,
    originalPrice: 54900000,
    discount: 5,
    isOnSale: true,
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&h=500&fit=crop&crop=center',
    category: '전기차',
    rating: 4.8,
    reviews: 3890
  },
  {
    id: '34',
    name: '기아 EV9',
    description: '기아 플래그십 7인승 전기 SUV. 501km 주행거리와 2열 회전 시트, 고급 ADAS.',
    price: 64900000,
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=500&h=500&fit=crop&crop=center',
    category: '전기차',
    rating: 4.9,
    reviews: 1567
  },
];
