const SMALL_NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
] as const;

const TENS_WORDS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
] as const;

function integerToIndianWords(value: number): string {
  if (value < 20) {
    return SMALL_NUMBER_WORDS[value] ?? "";
  }
  if (value < 100) {
    const remainder = value % 10;
    return `${TENS_WORDS[Math.floor(value / 10)]}${
      remainder ? ` ${integerToIndianWords(remainder)}` : ""
    }`;
  }
  if (value < 1_000) {
    const remainder = value % 100;
    return `${integerToIndianWords(Math.floor(value / 100))} hundred${
      remainder ? ` ${integerToIndianWords(remainder)}` : ""
    }`;
  }
  const scales = [
    { value: 10_000_000, label: "crore" },
    { value: 100_000, label: "lakh" },
    { value: 1_000, label: "thousand" },
  ] as const;
  const scale = scales.find((item) => value >= item.value);
  if (!scale) {
    return "";
  }
  const remainder = value % scale.value;
  return `${integerToIndianWords(Math.floor(value / scale.value))} ${scale.label}${
    remainder ? ` ${integerToIndianWords(remainder)}` : ""
  }`;
}

function titleCaseWords(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function numberToIndianWords(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }
  const rounded = Math.round(Math.abs(value));
  const words = titleCaseWords(integerToIndianWords(rounded));
  return value < 0 ? `Minus ${words}` : words;
}

export function amountToIndianRupeeWords(value: number): string {
  const words = numberToIndianWords(value);
  if (!words) {
    return "";
  }
  return `${words} Rupees`;
}
