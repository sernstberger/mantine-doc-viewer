/** The seven other students' essays for the Markbook story: different stances, different text */
export interface EssayText {
  id: string;
  name: string;
  /** Surname for the running header */
  surname: string;
  date: string;
  title: string;
  /**
   * The paragraph each rubric criterion's margin note is about (from 0), in rubric order:
   * argument (its last two lines, where the thesis is), evidence, structure and language
   */
  marks: [number, number, number, number];
  paragraphs: string[];
}

export const OTHER_ESSAYS: EssayText[] = [
  {
    id: 'berg',
    name: 'Tomas Berg',
    surname: 'Berg',
    date: '12 November 2026',
    title: 'A Phone Is a Tool, So Teach Us to Use It',
    marks: [0, 1, 2, 3],
    paragraphs: [
      'Every morning I walk past the lockers with my phone in my pocket, and every morning I know exactly what it can do for me. It holds my timetable, my homework list and the bus times that get me home. Banning it would not make me a better student. It would only take away something I use properly. That is why I think Fairmount High School should teach responsible use instead of locking phones away.',
      'First, phones are already part of how we learn. In science last month we filmed a falling ball and slowed the clip down to measure how fast it dropped. Nobody could have done that with a pencil. In languages, a translation app lets me check a word in two seconds instead of two minutes, and the lesson keeps moving. A school that wants us ready for the future should not treat the most common tool of our time as a threat.',
      "Second, a ban punishes the many for the few. Most students put their phone away when asked. A small group do not, and they are the ones teachers already know about. Taking everyone's phone because of them is like cancelling sport because someone tripped. A better rule is simple: phones stay face down on the desk, and a teacher can ask to see the screen at any time.",
      'Third, there is safety. Many of us travel a long way, and some of us look after younger brothers and sisters after school. Being able to answer a message from a parent is not a distraction. It is a part of how our families work. A locker is no help when the bus is late and the front office is already closed.',
      'I do not pretend that phones are harmless. They can pull attention away, and I have lost an hour to a video I meant to watch for one minute. But the answer to that is practice. If the school ran a short unit on how to manage notifications, we would leave with a skill that no locker can teach. Trust works better than a lock, and I think most of us would live up to it.',
    ],
  },
  {
    id: 'brooks',
    name: 'Aiyana Brooks',
    surname: 'Brooks',
    date: '12 November 2026',
    title: 'Six Hours Without a Screen',
    marks: [0, 1, 3, 2],
    paragraphs: [
      'When my little cousin visited last summer, she asked me why everyone at the table was looking at a rectangle instead of at each other. I had no good answer. I have thought about her question ever since, and it is the reason I believe our school day should be a phone-free day.',
      "The case starts with what the research says. A large study from Norway followed more than a hundred schools and found that, after phone rules were introduced, girls' marks went up and visits to the school counsellor dropped. The results were strongest for students from poorer families, who have the most to gain from every lesson. When a rule helps those who need it most and costs the rest almost nothing, it deserves our support.",
      'The case continues with how we feel. Nobody admits it, but there is pressure to answer every message at once, to post at the right moment and to look good in every photo. For six hours a day that pressure could simply stop. I have a friend who tells me that the only time she is not worried about being left out is when she is on the netball court with her phone in her bag.',
      'Some will say that a total ban is too harsh and that students should be trusted to make good choices. I would like to believe that. But a tired fifteen-year-old and an app built by experts are not an even match, and pretending otherwise is not fair to us. A clear rule takes the decision away, and for many students that is a relief.',
      'So my proposal is a small one. Phones go into a labelled pouch at the start of the day and come out at the final bell. Teachers can allow them for a set task. Everyone follows the same rule. Six hours without a screen is not a loss. It is a chance to remember what the room sounds like when people are talking.',
    ],
  },
  {
    id: 'choi',
    name: 'Hannah Choi',
    surname: 'Choi',
    date: '11 November 2026',
    title: 'Why I Changed My Mind About Phones',
    marks: [0, 1, 2, 3],
    paragraphs: [
      'At the start of the term I was sure that phones should stay in our pockets. I argued about it with my mum, and I argued about it with my friends. Then my class did a week with phones in a basket at the front, and I changed my mind. I now think the school should adopt a basket rule for lessons, though not for breaks.',
      'During that week I noticed three things. I finished my work faster. I remembered what the teacher said. And at the end of the lesson I did not feel tired in the strange way that I do after scrolling. That was surprising, because I had expected to be bored and annoyed.',
      'Of course there are things to be careful about. Some students need a phone for health reasons, such as checking their blood sugar, and those students must always be able to keep one. The rule should say so clearly. A good rule does not forget the people it could hurt by accident.',
      'Breaks are different. At lunch we are allowed to relax, and for many of us the phone is how we talk to friends from other schools or to family. Taking that away would feel like a punishment, and I do not think the school wants to punish us. A rule that covers lessons only is easier to follow and easier to defend.',
      'In the end, a rule is only good if students believe in it. I did not believe in it until I tried it. So my suggestion is that every class tries the basket for one week before the school decides. If I can change my mind, I think a lot of other people can too.',
    ],
  },
  {
    id: 'novak',
    name: 'Elias Novak',
    surname: 'Novak',
    date: '13 November 2026',
    title: 'The Locker Rule Is the Right Rule',
    marks: [0, 1, 3, 2],
    paragraphs: [
      'There is a rule at my old club that nobody talks about phones during training. When I started, I thought it was silly. After a month I knew it was the reason that our team worked. We looked at each other, we shouted, and we noticed when somebody was upset. I want the same thing for Fairmount, which is why I support putting phones in lockers during the school day.',
      'Start with the lessons. A teacher can tell when a room is listening. The questions get sharper, the jokes land and the quiet kids join in. When phones are out, you can feel the room split into people who are here and people who are somewhere else. Teachers spend the first five minutes of every lesson getting us back, and across a year that is days of learning lost.',
      'Next, consider the playground and the canteen. When I was in Year 7 we played handball every break. Now the courts are mostly empty, and there are rows of students sitting on the steps with their heads down. I do not think anybody chose that. It happened slowly, one notification at a time. A locker rule would give the courts back.',
      'People say that parents want to reach their children. That is true, and the answer is the office phone. It has worked for decades and it will keep working. In a real emergency, the school will tell us what to do, and a hundred students texting at once would only slow it down.',
      'I know that this essay is late, and I am sorry. I could not stop checking my phone while I wrote it, which is a good reason to support the rule. If a ban makes it easier for me to sit down and finish what I started, then it will do the same for a lot of other people.',
    ],
  },
  {
    id: 'reyes',
    name: 'Callum Reyes',
    surname: 'Reyes',
    date: '12 November 2026',
    title: 'Let Us Keep Our Phones, But Not Use Them Everywhere',
    marks: [0, 1, 2, 3],
    paragraphs: [
      'I think the school has to be honest about one thing: a total ban will not work, and a total freedom does not work either. Last week I counted how often I picked up my phone during a Tuesday, and the number was forty-one. That is too many, and I want a rule that helps me bring it down. I also want a rule I can follow without feeling like I am being treated as a child.',
      'My proposal has three parts. First, phones are off and in bags during lessons unless the teacher says otherwise. Second, phones are allowed at break and lunch in the yard and the library. Third, anyone who breaks the rule hands their phone to the teacher until the end of the lesson. It is clear, it is fair and a student can explain it to a parent in one sentence.',
      'The reason I prefer this to a locker is trust. When a rule says we cannot be trusted at all, many students stop trying. When it says that lessons are for learning and breaks are for us, it gives us a reason to cooperate. I have seen this with the library rule, which most students follow without being watched.',
      'A second reason is practicality. Lockers are far from some classrooms, and a queue at the lockers at the start of every lesson would waste time. Keeping the phone in a bag takes five seconds and nobody has to organise anything. Schools should choose rules that are easy to keep, because rules that are hard to keep end up being broken.',
      'I realise that some people will still sneak a look under the desk. They will do that under any rule. What matters is that most students follow it most of the time, and that the ones who do not face a small and fair consequence. That is the kind of rule I would be happy to live with.',
    ],
  },
  {
    id: 'silva',
    name: 'Mateo Silva',
    surname: 'Silva',
    date: '12 November 2026',
    title: 'Phones Do More Good Than Harm',
    marks: [0, 1, 2, 3],
    paragraphs: [
      'People who want to ban phones often talk as if students use them for nothing but games. My experience is different. I use my phone to scan my notes into one folder, to record the teacher when I miss a point and to ask a classmate overseas about a book we both read. A ban would take all of that away to solve a problem that most of us do not have.',
      'The first thing to say is that phones help students who find school hard. My cousin has dyslexia, and a reading app that speaks the text out loud changed how she feels about English. A ban with no exceptions would make her stand up in front of the class and ask to use it, which is exactly the kind of attention she hates. A rule that works for most people should not be written so that it is cruel to a few.',
      'The second thing is that banning phones does not remove the reason students pick them up. If a lesson is dull, a student will find something else to do, such as doodling or talking. The phone is a symptom. A good teacher who asks interesting questions will beat a notification every time, and I have had plenty of those teachers at Fairmount.',
      'Finally, think about the world we are being prepared for. Offices, hospitals and building sites all use phones and tablets every day. Learning to put one down at the right moment is a skill, and we only learn it by practising it. A locker does not teach that. A conversation with a teacher about why it matters does.',
      'I am not saying that phones are always good. I am saying that the school should spend its energy on teaching students to use them well, and on making lessons that deserve our attention. If it does both, nobody will need a locker.',
    ],
  },
  {
    id: 'whitfield',
    name: 'Dara Whitfield',
    surname: 'Whitfield',
    date: '11 November 2026',
    title: 'Give Us the Quiet Back',
    marks: [0, 1, 3, 2],
    paragraphs: [
      'The loudest sound at my old primary school was laughter. The loudest sound at Fairmount, at lunch, is the buzzing of phones on the tables. I do not want to sound old, because I am fifteen and I like my phone as much as anyone. But I think the school day would be better if we gave the phones a break, and I want to explain why.',
      'Let me begin with the numbers. A study of English schools by the London School of Economics found that banning phones raised results by about as much as adding five days to the school year, and that it helped the weakest students most. If the school could buy that much learning for free, we would be silly to say no. The cost is that for a few hours a day, we are a little less connected.',
      'Then there is what the numbers cannot show. In my netball team, we used to talk on the bus to the game. Now half the team listens to music and the other half watches videos. I am not saying anybody is wrong, but we have lost something small and warm. A day with no phones would give some of it back.',
      'The usual objection is that students need to reach their parents. I agree that there must be a way, and there is one: the front office. Parents can call, and the office can find us in two minutes. In an emergency that is faster and safer than a thousand text messages. Students who need a phone for medical reasons should be able to keep one, and the rule should say so.',
      'In summary, a locker rule is fair, it is simple and it works. It supports learning, it helps friendships and it protects the students who find it hardest to look away. I would ask the school to try it for one term and see what it sounds like. I think it will sound like laughter.',
    ],
  },
];
