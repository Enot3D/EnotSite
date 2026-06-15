const PRODUCTS = [
    {
        id: 1,
        name: "Керамическая ваза «Элегант»",
        description: "Ручная работа из керамической глины. Идеально подходит для букетов и интерьерных композиций.",
        price: 2490,
        category: "vases",
        material: "Керамика",
        colors: [
            { 
                name: "Белый", 
                hex: "#FFFFFF", 
                images: [
                    "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800",
                    "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800",
                    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=800"
                ]
            },
            { 
                name: "Черный", 
                hex: "#1a1a1a", 
                images: [
                    "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800",
                    "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800",
                    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=800"
                ]
            },
            { 
                name: "Бежевый", 
                hex: "#d4c5a9", 
                images: [
                    "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800",
                    "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800",
                    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=800"
                ]
            }
        ],
        inStock: true,
        rating: 4.8,
        reviews: 124
    },
    {
        id: 2,
        name: "Деревянная рамка «Натура»",
        description: "Экологичная рамка из натурального дерева. Подходит для фото 10x15 и 15x20.",
        price: 890,
        category: "frames",
        material: "Натуральное дерево",
        colors: [
            { 
                name: "Светлое дерево", 
                hex: "#c9a66b", 
                images: [
                    "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800",
                    "https://images.unsplash.com/photo-1583946099379-f9c4d4d1f2b8?w=800"
                ]
            },
            { 
                name: "Тёмное дерево", 
                hex: "#5c4033", 
                images: [
                    "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800",
                    "https://images.unsplash.com/photo-1583946099379-f9c4d4d1f2b8?w=800"
                ]
            }
        ],
        inStock: true,
        rating: 4.6,
        reviews: 89
    },
    {
        id: 3,
        name: "Настольная лампа «Луна»",
        description: "Минималистичная лампа с регулировкой яркости. Создаёт мягкое рассеянное освещение.",
        price: 4590,
        category: "lighting",
        material: "Металл + матовый пластик",
        colors: [
            { 
                name: "Матовый белый", 
                hex: "#f5f5f5", 
                images: [
                    "https://images.unsplash.com/photo-1507473885765-e6ed057ab788?w=800",
                    "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800"
                ]
            },
            { 
                name: "Матовый черный", 
                hex: "#2d2d2d", 
                images: [
                    "https://images.unsplash.com/photo-1507473885765-e6ed057ab788?w=800",
                    "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800"
                ]
            }
        ],
        inStock: true,
        rating: 4.9,
        reviews: 203
    },
    {
        id: 4,
        name: "Подушка декоративная «Мягкий облако»",
        description: "Бархатная подушка с наполнителем из пуха. Размер 40x40 см.",
        price: 1290,
        category: "textiles",
        material: "Бархат / пуховой наполнитель",
        colors: [
            { 
                name: "Серый", 
                hex: "#9e9e9e", 
                images: [
                    "https://images.unsplash.com/photo-1584100936595-c0c5f8d54073?w=800",
                    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"
                ]
            },
            { 
                name: "Розовый", 
                hex: "#f8bbd9", 
                images: [
                    "https://images.unsplash.com/photo-1584100936595-c0c5f8d54073?w=800",
                    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"
                ]
            },
            { 
                name: "Белый", 
                hex: "#ffffff", 
                images: [
                    "https://images.unsplash.com/photo-1584100936595-c0c5f8d54073?w=800",
                    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"
                ]
            }
        ],
        inStock: true,
        rating: 4.7,
        reviews: 156
    },
    {
        id: 5,
        name: "Кашпо керамическое «Садик»",
        description: "Кашпо с поддоном для комнатных растений. Высота 12 см, диаметр 14 см.",
        price: 790,
        category: "planters",
        material: "Керамика",
        colors: [
            { 
                name: "Терракот", 
                hex: "#c27849", 
                images: [
                    "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800",
                    "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800"
                ]
            },
            { 
                name: "Белый", 
                hex: "#ffffff", 
                images: [
                    "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800",
                    "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800"
                ]
            }
        ],
        inStock: true,
        rating: 4.5,
        reviews: 67
    },
    {
        id: 6,
        name: "Свеча ароматическая «Вечер»",
        description: "Свеча из натурального соевого воска с ароматом сандала и ванили. Время горения 40 часов.",
        price: 590,
        category: "candles",
        material: "Соевый воск / стекло",
        colors: [
            { 
                name: "Прозрачное стекло", 
                hex: "#e0e0e0", 
                images: [
                    "https://images.unsplash.com/photo-1602607083813-6da8e0e90216?w=800",
                    "https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?w=800"
                ]
            }
        ],
        inStock: true,
        rating: 4.8,
        reviews: 312
    }
];
