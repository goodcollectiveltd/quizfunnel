// Real customer testimonials, ported from
// company-context/testimonials/testimonials.md.
// All are from public review platforms (Facebook / Trustpilot / Instagram).
// `symptoms` tags map each quote to the quiz symptoms it proves, so the result
// page and landers can auto-pull matching proof. IDs mirror the T## in the bank.

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
  rating?: 5;
  symptoms: SymptomTag[];
  // narrative angles used for objection-handling copy
  angles?: Array<"vs-baked" | "off-vet-meds" | "tried-everything" | "small-dog" | "fast">;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "T01",
    quote:
      "I've tried a few over the past 3 years and no doubt these are the best — no paw licking or head shaking for the past 2 weeks after 4 weeks in. Happy dog 🦴💗",
    author: "Elaine Stanley",
    source: "Facebook",
    symptoms: ["paw-licking", "gunky-ears"],
    angles: ["tried-everything"],
  },
  {
    id: "T03",
    quote:
      "My French bulldog still had to have monthly injections at the vets for so-called allergies at £120 a month. For the last two months I've been using Good for Pets probiotic and the change is amazing. If your dog has been licking and scratching — get Good for Pets, you won't regret it 👍",
    author: "Shaun Mcnally",
    source: "Facebook",
    symptoms: ["paw-licking", "itchy-skin"],
    angles: ["off-vet-meds"],
  },
  {
    id: "T04",
    quote:
      "Absolutely brilliant. My 10-month staffie has allergies and wouldn't stop licking his feet. With these tablets every day, his white socks are back to being white and no more licking. Even told my vet what I was giving him.",
    author: "Ness Tranter",
    source: "Facebook",
    symptoms: ["paw-licking", "itchy-skin"],
  },
  {
    id: "T07",
    quote:
      "They really work. We used all sorts before and they were useless. Her ears are completely clean and don't smell at all. We started them in December 👌",
    author: "Rob Chambers",
    source: "Facebook",
    symptoms: ["gunky-ears"],
    angles: ["tried-everything"],
  },
  {
    id: "T10",
    quote:
      "These are brilliant! I had my boy on the baked ones before — these are another level completely. What a difference they've made. They also last four weeks instead of three. Win, win!",
    author: "Tanya Smith",
    source: "Facebook",
    symptoms: ["gunky-ears"],
    angles: ["vs-baked"],
  },
  {
    id: "T11",
    quote:
      "I use probiotics for my dog after 2 years of vets not solving the problem, and within weeks his skin totally cleared. So I'm afraid it ain't no scam.",
    author: "Dawn Lister",
    source: "Facebook",
    symptoms: ["itchy-skin"],
    angles: ["tried-everything", "off-vet-meds"],
  },
  {
    id: "T13",
    quote:
      "An absolute game changer for my Frenchie — constantly chewing and licking his paws, scratching ears full of black gunk. I tried 3 other probiotics which did nothing. No more scratching or licking, his ears are very clean, and his eyes literally sparkle now.",
    author: "Amanda Hall",
    source: "Facebook",
    symptoms: ["paw-licking", "gunky-ears", "tear-staining"],
    angles: ["tried-everything"],
  },
  {
    id: "T14",
    quote:
      "My Frenchie was constantly licking her paws, scratching her face and shaking her head. We tried so many things over the years for her yeasty skin — nothing worked, until now! After two months she's a completely different dog. No more itching, licking or head shaking.",
    author: "Natalie Baptie-Wood",
    source: "Trustpilot",
    rating: 5,
    symptoms: ["paw-licking", "itchy-skin", "gunky-ears"],
    angles: ["tried-everything"],
  },
  {
    id: "T15",
    quote:
      "My dog was on the baked chews but saw the advert saying non-baked is better. Been on these about 2½ weeks and saw a massive difference already. Since 2018 I've spent so much on steroids, ear drops and cleaning — now her ears are practically clean and no itching at all.",
    author: "Katie Swales",
    source: "Facebook",
    symptoms: ["gunky-ears", "itchy-skin"],
    angles: ["vs-baked", "off-vet-meds"],
  },
  {
    id: "T16",
    quote:
      "I was very dubious a probiotic could improve our pug Rolo's severe itching. A few months in he's like a new dog — his skin is no longer itchy, his fur is in great condition, and he's not hyperventilating in distress.",
    author: "Caroline Louise",
    source: "Facebook",
    symptoms: ["itchy-skin"],
    angles: ["off-vet-meds", "tried-everything"],
  },
  {
    id: "T17",
    quote:
      "Haggis the staffy was on Apoquel and a weekly injection for his allergies. I tried different chews, sprays and lotions — nothing worked and I was about to give up. Then I found these. WOWZERS — no more paw licking and chewing, no more gunky ears. A much happier dog.",
    author: "Calum McAllion",
    source: "Facebook",
    symptoms: ["paw-licking", "gunky-ears", "itchy-skin"],
    angles: ["off-vet-meds", "tried-everything"],
  },
  {
    id: "T20",
    quote:
      "What a difference this has made — she's only been on it 4 days and no more paw licking 🥳 and her eyes are not as weepy, no eating grass either. It's a win win all round.",
    author: "Rosie",
    source: "Trustpilot",
    rating: 5,
    symptoms: ["paw-licking", "tear-staining"],
  },
  {
    id: "T21",
    quote:
      "Absolutely love these. Almost two weeks in and a vast improvement with my eldest Boston — she's hardly licking her paws and the discolouration is improving.",
    author: "Richie Daiches Barlow",
    source: "Facebook",
    symptoms: ["paw-licking", "tear-staining"],
  },
  {
    id: "T22",
    quote:
      "My English Pointer stopped scratching at her ears after just over two weeks. Will definitely be reordering 👍😊",
    author: "Gaynor Marie Jones",
    source: "Facebook",
    symptoms: ["gunky-ears"],
  },
  {
    id: "T23",
    quote:
      "These have worked brilliantly for my dachshund. He'd chewed his paws until they were open wounds. Vet-prescribed steroids and anti-anxiety meds did not work. These probiotics have been the answer for us!",
    author: "Angela Woods",
    source: "Facebook",
    symptoms: ["paw-licking"],
    angles: ["off-vet-meds", "small-dog"],
  },
  {
    id: "T28",
    quote:
      "Had my staffy on these about 6 weeks. His stools were much better within a couple of weeks and his gunky ears have cleared up too! Setting up a subscription.",
    author: "Nikki Curwen",
    source: "Trustpilot",
    rating: 5,
    symptoms: ["tummy", "gunky-ears", "paw-licking"],
  },
  {
    id: "T29",
    quote:
      "I've been using these over 3 weeks — they're brilliant, no more upset tummy or sloppy poos.",
    author: "Lynn Stevenson",
    source: "Facebook",
    symptoms: ["tummy"],
  },
  {
    id: "T30",
    quote:
      "Amazing stuff — both my Frenchies stopped the scratching, biting and licking their paws, and the No.2s are less messy, only after a month.",
    author: "Peter Prokai",
    source: "Facebook",
    symptoms: ["tummy", "paw-licking"],
  },
  {
    id: "T32",
    quote:
      "Finally crushed them and stirred into food till hidden. No more scooting, poo natural. Not quite a fortnight and marked improvements.",
    author: "Danny Joseph Pinner",
    source: "Facebook",
    symptoms: ["scooting", "tummy"],
    angles: ["small-dog"],
  },
  {
    id: "T33",
    quote:
      "Amazing for my two Pomeranians. One had Alopecia X from a bad yeast infection — I'd tried many others but nothing helped until Good for Pets. He now has his full coat back.",
    author: "Sherry Berry",
    source: "Trustpilot",
    rating: 5,
    symptoms: ["itchy-skin"],
    angles: ["tried-everything"],
  },
  {
    id: "T34",
    quote:
      "Just over a month in and the difference is amazing. Her ears are the best they've been in a long time, she's no longer scooting or eating grass, and her eyes look so much clearer with way less tear staining. Full of energy again.",
    author: "Elaine Conway",
    source: "Trustpilot",
    rating: 5,
    symptoms: ["gunky-ears", "scooting", "tear-staining"],
  },
  {
    id: "T35",
    quote:
      "My cockapoo chewed her paws and scratched her ears constantly. We were told to give it a few months — after 12–14 weeks I noticed a huge change. She stopped chewing her paws, her ears are clean and healthy, regular solid poos, and she's a lot happier in herself.",
    author: "Joanne East",
    source: "Trustpilot",
    rating: 5,
    symptoms: ["paw-licking", "gunky-ears", "tummy"],
  },
  {
    id: "T38",
    quote:
      "Amazing results. The only thing that has worked — and I feel like I've tried every potion.",
    author: "Kim Berly",
    source: "Facebook",
    symptoms: ["itchy-skin", "paw-licking"],
    angles: ["tried-everything"],
  },
];

export const byId = (id: string) => TESTIMONIALS.find((t) => t.id === id)!;

/** All testimonials tagged with a given symptom, in bank order. */
export function testimonialsFor(symptom: SymptomTag): Testimonial[] {
  return TESTIMONIALS.filter((t) => t.symptoms.includes(symptom));
}
