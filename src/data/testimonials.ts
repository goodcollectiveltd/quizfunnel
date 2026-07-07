// Real customer testimonials, pulled from the "Let customers speak for us"
// section on goodforpets.co/products/5-strain-probiotic. Each review is paired
// with THAT customer's own dog photo (from the same product page), so every
// card on the result page shows a correctly-correlated dog, not a stock stand-in.
// `symptoms` tags map each quote to the quiz symptoms it proves, so the result
// page auto-pulls matching proof. Photos live in /images/reviews/<name>.jpg.

export type SymptomTag =
  | "paw-licking"
  | "itchy-skin"
  | "gunky-ears"
  | "tummy"
  | "scooting"
  | "tear-staining";

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  source: "Facebook" | "Trustpilot" | "Instagram";
  image?: string; // the reviewer's own dog photo (real, correlated), /images/reviews/<name>.jpg
  rating?: 5;
  symptoms: SymptomTag[];
  // narrative angles used for objection-handling copy
  angles?: Array<"vs-baked" | "off-vet-meds" | "tried-everything" | "small-dog" | "fast">;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "R1",
    quote:
      "I started these on the 24th January 2025. Today I actually saw a difference, no more paw licking or chewing. I cleaned her ears out today and nothing in there either. A much more relaxed and happy dog, thank you :)",
    author: "Julie C",
    source: "Facebook",
    image: "/images/reviews/julie.jpg",
    rating: 5,
    symptoms: ["paw-licking", "gunky-ears"],
  },
  {
    id: "R2",
    quote:
      "These are brilliant! I had my boy on the baked alternative prior to seeing these and they slightly helped his ear problems. These are another level completely. What a difference they have made. They also last me four weeks instead of three because he needs four of these instead of the five baked, so a wee save for my pocket too. Win, win!",
    author: "Tanya S",
    source: "Facebook",
    image: "/images/reviews/tanya.jpg",
    rating: 5,
    symptoms: ["gunky-ears"],
    angles: ["vs-baked"],
  },
  {
    id: "R3",
    quote:
      "I have been using 4 tablets a day for the past 3 weeks for my old English Mastiff and I can confirm that they have made a big difference already to ears, skin and paws. Also her poo is now normal. These tablets have been a blessing.",
    author: "Nicola G",
    source: "Facebook",
    image: "/images/reviews/nicola.jpg",
    rating: 5,
    symptoms: ["gunky-ears", "itchy-skin", "paw-licking", "tummy"],
  },
  {
    id: "R4",
    quote:
      "This works. I tried everything. My bulldog, for 2 and a half years, licked her paws bald and raw every summer. Nothing worked, not even the Apoquel the vet gave me at £140 for 2 weeks. This was £33 including delivery and lasts about 2 months. It took a week to start working, but she hasn't picked at them for 3 weeks now.",
    author: "Chris Brooks",
    source: "Facebook",
    image: "/images/reviews/chris.jpg",
    rating: 5,
    symptoms: ["paw-licking", "itchy-skin"],
    angles: ["off-vet-meds", "tried-everything"],
  },
  {
    id: "R5",
    quote:
      "My Staffy was eating cat poo at about 8 months old, his energy was gone and his breath turned to an ammonia smell. We were getting stressed for him. We got these tablets to help and he went from all of that, plus the chewing and licking his paws, to being a healthy, happy, energetic puppy! He's still on them and enjoys eating them. For anyone on the fence, no need to be skeptical.",
    author: "Gareth Nibbs",
    source: "Facebook",
    image: "/images/reviews/gareth.jpg",
    rating: 5,
    symptoms: ["paw-licking", "tummy"],
  },
  {
    id: "R6",
    quote:
      "I've been giving the Good For Pets probiotic tablets to our yellow Lab for just over a month and the difference is incredible. Her ears are the best they've been in ages, no more scooting or grass eating, and her eyes are clearer with less tear staining. She's full of energy again, like a younger version of herself. Honestly can't recommend these enough.",
    author: "Elaine Conway",
    source: "Trustpilot",
    image: "/images/reviews/elaine.jpg",
    rating: 5,
    symptoms: ["gunky-ears", "scooting", "tear-staining"],
  },
];

// Short, punchy "tried everything" one-liner used on the landing hook only (no
// correlated photo on file, so it renders with an initials avatar, never a
// stand-in dog). Kept out of TESTIMONIALS so it can't surface as result proof.
export const HOOK_TESTIMONIAL: Testimonial = {
  id: "H1",
  quote: "Amazing results. The only thing that has worked, and I feel like I've tried every potion.",
  author: "Kim Berly",
  source: "Facebook",
  rating: 5,
  symptoms: ["itchy-skin", "paw-licking"],
  angles: ["tried-everything"],
};

/** All testimonials tagged with a given symptom, in bank order. */
export function testimonialsFor(symptom: SymptomTag): Testimonial[] {
  return TESTIMONIALS.filter((t) => t.symptoms.includes(symptom));
}
