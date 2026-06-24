export interface SeedContent {
  title: string;
  text: string;
  lang: "en" | "ar";
}

export const SEEDS: SeedContent[] = [
  {
    title: "Photosynthesis (English)",
    lang: "en",
    text: "Photosynthesis is the process by which green plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of glucose. Chlorophyll, found in chloroplasts, captures light energy. The process has two main stages: the light-dependent reactions, which occur in the thylakoid membranes and produce ATP and NADPH, and the Calvin cycle, which occurs in the stroma and uses that energy to build glucose molecules.",
  },
  {
    title: "البناء الضوئي (Photosynthesis — Arabic)",
    lang: "ar",
    text: "البناء الضوئي هو العملية التي تستخدمها النباتات الخضراء لتحويل الطاقة الضوئية إلى طاقة كيميائية مخزّنة. تمتص النباتات ثاني أكسيد الكربون من الهواء والماء من التربة، وبمساعدة ضوء الشمس والكلوروفيل الموجود في البلاستيدات الخضراء، تنتج الجلوكوز والأكسجين. تنقسم عملية البناء الضوئي إلى مرحلتين رئيسيتين: التفاعلات الضوئية التي تحدث في الأغشية الثايلاكويدية وتنتج ATP وNADPH، ودورة كالفن التي تحدث في السدى وتستخدم تلك الطاقة لبناء جزيئات الجلوكوز.",
  },
  {
    title: "دورة الماء (Water Cycle — Arabic)",
    lang: "ar",
    text: "دورة الماء هي الحركة المستمرة للماء على سطح الأرض وفي الغلاف الجوي. تبدأ الدورة بالتبخر، حيث تتحول المياه من سطح البحار والمحيطات والأنهار إلى بخار ماء بفعل حرارة الشمس. يرتفع البخار إلى الغلاف الجوي ويبرد ليتكثف ويُشكّل السحاب. عندما تثقل قطرات الماء داخل السحاب، تسقط على شكل هطول مطري أو ثلجي. يتجمع الماء في الأنهار والبحيرات ويتسرب إلى باطن الأرض لتتجدد المياه الجوفية، ثم تبدأ الدورة من جديد.",
  },
  {
    title: "الكسور (Fractions — Arabic)",
    lang: "ar",
    text: "الكسر هو طريقة للتعبير عن جزء من كل. يتكون الكسر من عددين يفصل بينهما خط أفقي: البسط في الأعلى والمقام في الأسفل. يمثّل المقام عدد الأجزاء المتساوية التي قُسّم إليها الكل، بينما يمثّل البسط عدد الأجزاء التي نأخذها. مثلاً، الكسر ¾ يعني أننا قسّمنا الشيء إلى أربعة أجزاء متساوية وأخذنا ثلاثة منها. يمكن مقارنة الكسور: الكسر ذو المقام الأصغر أكبر قيمةً إذا تساوت البسوط. كما يمكن جمع الكسور وطرحها وضربها وقسمتها باتباع قواعد محددة.",
  },
  {
    title: "Fractions (English)",
    lang: "en",
    text: "A fraction represents a part of a whole. It is written as two numbers separated by a horizontal line: the numerator on top and the denominator on the bottom. The denominator tells you how many equal parts the whole has been divided into, and the numerator tells you how many of those parts you are taking. For example, ¾ means the whole is split into four equal parts and we take three. Fractions can be compared: if two fractions have the same numerator, the one with the smaller denominator is larger. Fractions can be added and subtracted when they share a common denominator; to multiply fractions, multiply the numerators together and the denominators together; to divide, multiply by the reciprocal of the divisor.",
  },
  {
    title: "Algebra — Linear Equations (English)",
    lang: "en",
    text: "A linear equation is an equation in which the highest power of the variable is one. The standard form is ax + b = c, where a, b, and c are constants and x is the unknown. To solve for x, apply inverse operations: subtract b from both sides, then divide both sides by a. The solution is the value of x that makes the equation true. Linear equations can also appear with variables on both sides, such as 2x + 3 = x + 7; in this case, collect like terms by subtracting x from both sides to get x + 3 = 7, then subtract 3 to find x = 4. Graphically, a linear equation in two variables (y = mx + b) represents a straight line, where m is the slope and b is the y-intercept.",
  },
  {
    title: "Geometry — Triangles (English)",
    lang: "en",
    text: "A triangle is a polygon with three sides and three angles. The sum of the interior angles of any triangle is always 180 degrees. Triangles are classified by their sides: equilateral (all three sides equal, all angles 60°), isosceles (two sides equal, two base angles equal), and scalene (no sides equal). They are also classified by their angles: acute (all angles less than 90°), right (one angle exactly 90°), and obtuse (one angle greater than 90°). The area of a triangle is calculated as half the base multiplied by the height: A = ½ × base × height. The Pythagorean theorem applies to right triangles: the square of the hypotenuse equals the sum of the squares of the other two sides (a² + b² = c²).",
  },
  {
    title: "Statistics — Mean, Median and Mode (English)",
    lang: "en",
    text: "Measures of central tendency summarise a data set with a single representative value. The mean is calculated by adding all values and dividing by the count; it is sensitive to outliers. The median is the middle value when data is arranged in order; if there is an even number of values, it is the average of the two middle values. The median is resistant to outliers and is preferred for skewed distributions. The mode is the value that appears most frequently; a data set can have no mode, one mode, or multiple modes. For example, in the data set {3, 5, 5, 7, 9}, the mean is (3+5+5+7+9)÷5 = 5.8, the median is 5, and the mode is 5. Choosing the right measure depends on the shape of the distribution and the presence of extreme values.",
  },
  {
    title: "The Water Cycle (English)",
    lang: "en",
    text: "The water cycle describes the continuous movement of water through Earth's systems. It begins with evaporation, where heat from the sun converts liquid water from oceans, lakes, and rivers into water vapour that rises into the atmosphere. As water vapour ascends, it cools and undergoes condensation, forming tiny droplets that cluster around dust particles to create clouds. When droplets grow heavy enough, they fall as precipitation — rain, snow, sleet, or hail — depending on temperature. On land, water either flows as surface runoff into rivers and lakes, or infiltrates the soil to recharge groundwater. Plants also return water to the atmosphere through transpiration. The combined process of evaporation and transpiration is called evapotranspiration. The cycle then repeats, distributing fresh water across the planet.",
  },
];
