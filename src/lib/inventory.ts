export type Stock = "In Stock" | "Limited Stock" | "Reserve Now";

export interface Vehicle {
  model: string;
  tagline: string;
  range: string;
  zero: string;
  top: string;
  price: string;
  priceNum: number;
  badge: Stock;
  image: string;
  description: string;
}

export const ORDER_EMAIL = "jameshilterson@gmail.com";

export const vehicles: Vehicle[] = [
  {
    model: "Model S",
    tagline: "Plaid performance sedan",
    range: "405 mi",
    zero: "1.99s",
    top: "200 mph",
    price: "$74,990",
    priceNum: 74990,
    badge: "In Stock",
    image:
      "https://digitalassets.tesla.com/tesla-contents/image/upload/h_2034,w_2880,c_fit,f_auto,q_auto:best/Mega-Menu-Vehicles-Model-S.png",
    description:
      "The Model S redefines what a car can be. With over 400 miles of range, ludicrous acceleration, and a minimalist interior built around a 17\" cinematic display.",
  },
  {
    model: "Model 3",
    tagline: "The world's best-selling EV",
    range: "358 mi",
    zero: "3.1s",
    top: "162 mph",
    price: "$40,240",
    priceNum: 40240,
    badge: "In Stock",
    image:
      "https://digitalassets.tesla.com/tesla-contents/image/upload/h_2034,w_2880,c_fit,f_auto,q_auto:best/Mega-Menu-Vehicles-Model-3.png",
    description:
      "The world's best-selling electric car. The Model 3 combines long range, advanced safety, and cutting-edge technology in a sleek, affordable package.",
  },
  {
    model: "Model X",
    tagline: "Falcon-wing flagship SUV",
    range: "348 mi",
    zero: "2.5s",
    top: "163 mph",
    price: "$79,990",
    priceNum: 79990,
    badge: "In Stock",
    image:
      "https://digitalassets.tesla.com/tesla-contents/image/upload/h_2034,w_2880,c_fit,f_auto,q_auto:best/Mega-Menu-Vehicles-Model-X.png",
    description:
      "With iconic falcon wing doors, seating for up to 7, and Plaid performance that rivals supercars — the Model X is the most capable SUV ever built.",
  },
  {
    model: "Model Y",
    tagline: "Versatile family electric SUV",
    range: "330 mi",
    zero: "3.5s",
    top: "135 mph",
    price: "$43,990",
    priceNum: 43990,
    badge: "In Stock",
    image:
      "https://digitalassets.tesla.com/tesla-contents/image/upload/h_2034,w_2880,c_fit,f_auto,q_auto:best/Mega-Menu-Vehicles-Model-Y.png",
    description:
      "The perfect blend of versatility and performance. A spacious interior, panoramic glass roof, and up to 7-seat configuration.",
  },
  {
    model: "Cybertruck",
    tagline: "Stainless-steel exoskeleton truck",
    range: "340 mi",
    zero: "2.6s",
    top: "130 mph",
    price: "$59,990",
    priceNum: 59990,
    badge: "Limited Stock",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/2024_Tesla_Cybertruck_Foundation_Series_in_Stealth_Grey%2C_front_left.jpg/1280px-2024_Tesla_Cybertruck_Foundation_Series_in_Stealth_Grey%2C_front_left.jpg",
    description:
      "Built with an ultra-hard stainless steel exoskeleton, armored glass, and tri-motor all-wheel drive — the toughest truck Tesla has made.",
  },
  {
    model: "Semi",
    tagline: "Long-haul electric class 8",
    range: "500 mi",
    zero: "5.0s",
    top: "65 mph",
    price: "$150,000",
    priceNum: 150000,
    badge: "Reserve Now",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tesla_Semi_at_Tesla_Delivery_Event.jpg/1280px-Tesla_Semi_at_Tesla_Delivery_Event.jpg",
    description:
      "The Tesla Semi transforms long-haul trucking with 500 miles of range, instant torque, and a driver-focused cabin.",
  },
  {
    model: "Roadster",
    tagline: "The fastest car in the world",
    range: "620 mi",
    zero: "1.9s",
    top: "250+ mph",
    price: "$200,000",
    priceNum: 200000,
    badge: "Reserve Now",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Tesla_Roadster_%282020%29.jpg/1280px-Tesla_Roadster_%282020%29.jpg",
    description:
      "The new Roadster shatters every performance record. 620 miles of range, 0–60 in under 2 seconds, top speed exceeding 250 mph.",
  },
];

export const badgeStyles: Record<Stock, string> = {
  "In Stock": "bg-success/15 text-success border-success/30",
  "Limited Stock": "bg-amber-500/15 text-amber-600 border-amber-500/30",
  "Reserve Now": "bg-blue-500/15 text-blue-600 border-blue-500/30",
};

export const buildMailto = (v: Vehicle) =>
  `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(
    `Tesla Order Inquiry – ${v.model}`
  )}&body=${encodeURIComponent(
    `Hello, I'm interested in the ${v.model} at ${v.price}. Please contact me.`
  )}`;
