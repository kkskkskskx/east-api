<?php
header('Content-Type: application/json');

$data = [
    "users" => [
        [
            "id" => 1,
            "name" => "Иван Петров",
            "username" => "ivan_92",
            "email" => "ivan92@example.com",
            "age" => 31,
            "isActive" => true,
            "roles" => ["user", "tester"],
            "address" => [
                "city" => "Киев",
                "street" => "ул. Шевченко",
                "house" => 12
            ],
            "createdAt" => "2026-05-03T10:15:30Z"
        ],
        [
            "id" => 2,
            "name" => "Анна Смирнова",
            "username" => "anna_dev",
            "email" => "anna.dev@example.com",
            "age" => 25,
            "isActive" => false,
            "roles" => ["admin"],
            "address" => [
                "city" => "Львов",
                "street" => "пр. Свободы",
                "house" => 7
            ],
            "createdAt" => "2026-04-28T08:22:10Z"
        ]
    ],
    "products" => [
        [
            "id" => 101,
            "name" => "Игровая мышь",
            "price" => 1299.99,
            "inStock" => true,
            "tags" => ["gaming", "pc", "rgb"]
        ],
        [
            "id" => 102,
            "name" => "Механическая клавиатура",
            "price" => 3499.50,
            "inStock" => false,
            "tags" => ["keyboard", "gaming"]
        ]
    ],
    "settings" => [
        "theme" => "dark",
        "language" => "ru",
        "notifications" => true
    ],
    "serverTime" => date("c") // текущее время сервера
];

echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
