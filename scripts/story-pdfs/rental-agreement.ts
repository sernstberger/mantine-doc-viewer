/** Short-term rental agreement for the Haven (travel marketplace checkout) story: 4 Letter pages */
import { line, paragraph, rect, StoryPage, StoryPdfSource, text } from './pdf-writer';

const W = 612;
const H = 792;
const INK = '#222222';
const MUTED = '#6a6a6a';
const RULE = '#dddddd';
const ROSE = '#e0475a';

function frame(pageNumber: number, body: string[]): StoryPage {
  return {
    width: W,
    height: H,
    content: [
      text(64, H - 56, 'haven', { size: 15, font: 'sansBold', color: ROSE }),
      text(W - 64 - 200, H - 55, 'House agreement  |  Reservation HV-48210', {
        size: 8.5,
        color: MUTED,
      }),
      line(64, H - 70, W - 64, H - 70, { color: RULE, width: 0.5 }),
      ...body,
      line(64, 56, W - 64, 56, { color: RULE, width: 0.5 }),
      text(64, 40, 'Birch Cabin on Lake Wenatchee', { size: 8.5, color: MUTED }),
      text(W - 64 - 36, 40, `Page ${pageNumber} of 4`, { size: 8.5, color: MUTED }),
    ].join('\n'),
  };
}

function heading(y: number, value: string) {
  return text(64, y, value, { size: 13, font: 'sansBold', color: INK });
}

/** Clauses laid out top to bottom: a bold heading then paragraphs */
function clauses(top: number, items: { title: string; body: string[] }[]) {
  const ops: string[] = [];
  let y = top;
  items.forEach((item) => {
    ops.push(heading(y, item.title));
    y -= 20;
    item.body.forEach((value) => {
      const block = paragraph(64, y, value, { size: 10, width: W - 128, color: INK, leading: 15 });
      ops.push(block.ops);
      y = block.y - 7;
    });
    y -= 12;
  });
  return ops;
}

function details(): StoryPage {
  const rows = [
    ['Host', 'Marta Lindqvist'],
    ['Guest', 'Daniel Okafor'],
    ['Property', 'Birch Cabin, 18240 Chiwawa Loop Road, Leavenworth, WA 98826'],
    ['Check-in', 'Friday 18 December 2026, from 4:00 pm'],
    ['Check-out', 'Wednesday 23 December 2026, by 10:00 am'],
    ['Guests', 'Up to 6 (4 adults and 2 children booked)'],
    ['Nightly rate', '$214.00 for 5 nights'],
    ['Security deposit', '$300.00, held on the card and released 7 days after check-out'],
  ];
  const table = rows.flatMap(([label, value], index) => {
    const y = H - 188 - index * 26;
    return [
      text(64, y, label, { size: 10, color: MUTED }),
      text(168, y, value, { size: 10, font: 'sansBold', color: INK }),
      line(64, y - 9, W - 64, y - 9, { color: RULE, width: 0.5 }),
    ];
  });
  const intro = paragraph(
    64,
    H - 128,
    'This agreement is between the host and the guest named below for a stay booked through Haven. It sets out what each side agrees to. Please read all four pages; you will be asked to sign at the end before your payment is taken.',
    { size: 10, width: W - 128, color: INK, leading: 15 }
  );
  const rest = clauses(H - 430, [
    {
      title: '1. The stay',
      body: [
        'The host lets the guest use the cabin, the deck, the dock and the woodshed for the dates above. The guest has no right to stay beyond check-out time unless the host agrees in writing through Haven.',
        'Only the people counted in the booking may stay overnight. Day visitors are welcome until 9:00 pm, up to four at a time.',
      ],
    },
  ]);
  return frame(1, [
    text(64, H - 104, 'Short-term rental agreement', { size: 20, font: 'sansBold', color: INK }),
    intro.ops,
    ...table,
    ...rest,
  ]);
}

function houseRules(): StoryPage {
  return frame(2, [
    text(64, H - 104, 'House rules', { size: 20, font: 'sansBold', color: INK }),
    ...clauses(H - 140, [
      {
        title: '2. Quiet hours and neighbours',
        body: [
          'Quiet hours run from 10:00 pm to 7:00 am. The nearest cabin is 80 metres away and sound carries across the water. Please keep music off the deck after 10:00 pm.',
        ],
      },
      {
        title: '3. Fire and the wood stove',
        body: [
          'Use the wood stove only with the dry seasoned wood in the shed. Keep the screen closed when no one is in the room. The fire pit may be used unless the county posts a burn ban; the host will message you if one applies.',
          'Never leave a fire unattended, and put it out with water before bed. Smoke alarms must not be covered or unplugged.',
        ],
      },
      {
        title: '4. Pets and smoking',
        body: [
          'Pets are not allowed. Service animals are welcome and need no advance notice. Smoking and vaping are not allowed inside the cabin or on the covered deck.',
        ],
      },
      {
        title: '5. Water, dock and boats',
        body: [
          "The dock is used at the guest's own risk. Children under 12 must wear a life jacket on the dock, and five are hung by the back door. The kayaks may be used from 8:00 am until sunset.",
          'The water is not tested for drinking from the lake. Use the kitchen tap, which is on the well and checked yearly.',
        ],
      },
      {
        title: '6. Rubbish and recycling',
        body: [
          'Bins go to the bear-proof box beside the driveway each evening. Please do not leave food outside overnight. Recycling is sorted into the two blue bins.',
        ],
      },
    ]),
  ]);
}

function cancellation(): StoryPage {
  const tiers = [
    ['More than 14 days before check-in', 'Full refund of the nightly rate and cleaning fee'],
    ['7 to 14 days before check-in', '50% of the nightly rate refunded, cleaning fee refunded'],
    ['Less than 7 days before check-in', 'No refund of the nightly rate; cleaning fee refunded'],
  ];
  const table = tiers.flatMap(([when, what], index) => {
    const y = H - 168 - index * 34;
    return [
      rect(64, y - 14, W - 128, 30, { fill: index % 2 === 0 ? '#f7f7f7' : '#ffffff' }),
      text(74, y - 1, when, { size: 10, font: 'sansBold', color: INK }),
      text(268, y - 1, what, { size: 9.5, color: INK }),
    ];
  });
  return frame(3, [
    text(64, H - 104, 'Cancellation and damage', { size: 20, font: 'sansBold', color: INK }),
    heading(H - 140, '7. If the guest cancels'),
    ...table,
    ...clauses(H - 280, [
      {
        title: '8. If the host cancels',
        body: [
          'If the host cancels, the guest receives a full refund and Haven will help find a similar place nearby. The host may not cancel within 7 days of check-in except for safety reasons such as wildfire or road closure.',
        ],
      },
      {
        title: '9. Damage and the security deposit',
        body: [
          'The guest is responsible for damage beyond normal wear caused by the guest or their visitors. Please report any breakage within 24 hours so it can be repaired before the next guest. The host will photograph the cabin on arrival and after check-out.',
          "The host may keep part of the deposit to cover the cost of repair or replacement, with receipts shared through Haven within 7 days. Anything beyond the deposit is claimed through Haven's resolution centre.",
        ],
      },
      {
        title: '10. Lost keys and lockouts',
        body: [
          'The cabin uses a keypad. If the code does not work, call the host on the number in your itinerary. A lockout call after 10:00 pm may be charged at $75.',
        ],
      },
    ]),
  ]);
}

function signatures(): StoryPage {
  const block = (x: number, who: string, name: string) => [
    text(x, 360, who, { size: 10, color: MUTED }),
    line(x, 300, x + 220, 300, { color: INK, width: 0.75 }),
    text(x, 284, name, { size: 10, font: 'sansBold', color: INK }),
    text(x, 252, 'Date', { size: 10, color: MUTED }),
    line(x, 236, x + 220, 236, { color: INK, width: 0.75 }),
  ];
  const lead = paragraph(
    64,
    H - 140,
    'By signing, the guest confirms they have read the house rules and the cancellation and damage terms, and agrees to follow them during the stay. The host has already signed this agreement.',
    { size: 10, width: W - 128, color: INK, leading: 15 }
  );
  const more = clauses(H - 230, [
    {
      title: '11. Disputes',
      body: [
        "The host and guest agree to try to settle any disagreement through Haven's resolution centre first. This agreement is governed by the laws of the State of Washington.",
      ],
    },
    {
      title: '12. The whole agreement',
      body: [
        'This agreement, together with the listing description and booking details on Haven, is the whole agreement. Changes must be agreed in writing through Haven.',
      ],
    },
  ]);
  return frame(4, [
    text(64, H - 104, 'Signatures', { size: 20, font: 'sansBold', color: INK }),
    lead.ops,
    ...more,
    ...block(64, 'Guest', 'Daniel Okafor'),
    ...block(328, 'Host', 'Marta Lindqvist'),
    // The host signed in advance; the guest line stays empty for the reader
    text(336, 306, 'Marta Lindqvist', { size: 20, font: 'serifItalic', color: '#2a3a5c' }),
    text(336, 242, '2 November 2026', { size: 10, color: INK }),
  ]);
}

const source: StoryPdfSource = {
  fileName: 'rental-agreement.pdf',
  build: () => ({
    title: 'House agreement, Birch Cabin on Lake Wenatchee',
    author: 'Haven',
    subject: 'Reservation HV-48210, 18 to 23 December 2026',
    outline: [
      { title: 'Parties and dates', page: 1 },
      { title: 'House rules', page: 2 },
      { title: 'Cancellation and damage', page: 3 },
      { title: 'Signatures', page: 4 },
    ],
    pages: [details(), houseRules(), cancellation(), signatures()],
  }),
};

export default source;
