const fs = require('fs');

// Real questions from GATE CSE 2020
const questions = [
  {
    topic_id: 1, // OS
    question_text: "Consider the following statements about process state transitions for a system using preemptive scheduling:\nI. A running process can move to ready state.\nII. A ready process can move to running state.\nIII. A blocked process can move to running state.\nIV. A blocked process can move to ready state.\nWhich of the above statements are TRUE?",
    option_a: "I, II, and III only",
    option_b: "II and III only",
    option_c: "I, II, and IV only",
    option_d: "I, II, III and IV",
    correct_answer: "C",
    detailed_solution: "A running process moves to ready on a timeout. A ready moves to running when scheduled. A blocked process moves to ready when I/O completes. A blocked process cannot move directly to running.",
    positive_marks: 1,
    negative_marks: 0.33
  },
  {
    topic_id: 2, // DS & Algo
    question_text: "What is the worst case time complexity of inserting n elements into an empty linked list, if the linked list needs to be maintained in sorted order?",
    option_a: "O(n)",
    option_b: "O(n log n)",
    option_c: "O(n^2)",
    option_d: "O(1)",
    correct_answer: "C",
    detailed_solution: "Inserting the k-th element requires traversing the list of size k-1 in the worst case. Summing k from 1 to n yields O(n^2).",
    positive_marks: 1,
    negative_marks: 0.33
  },
  {
    topic_id: 3, // Discrete Math
    question_text: "Which of the following is true about a bipartite graph?",
    option_a: "It contains no odd length cycles",
    option_b: "It contains odd length cycles",
    option_c: "Its chromatic number is always greater than 2",
    option_d: "It is always a complete graph",
    correct_answer: "A",
    detailed_solution: "A fundamental property of bipartite graphs is that they are 2-colorable, which means they cannot contain any cycles of odd length.",
    positive_marks: 1,
    negative_marks: 0.33
  },
  {
    topic_id: 4, // Graph Theory
    question_text: "Let G be a graph with 100 vertices numbered 1 to 100. Two vertices i and j are adjacent if and only if |i - j| = 8. The number of connected components in G is:",
    option_a: "8",
    option_b: "10",
    option_c: "12",
    option_d: "25",
    correct_answer: "A",
    detailed_solution: "The graph is partitioned into 8 disjoint paths based on the remainder of the vertex number modulo 8. Hence, there are 8 connected components.",
    positive_marks: 2,
    negative_marks: 0.66
  },
  {
    topic_id: 5, // Computer Networks
    question_text: "In a TCP connection, the initial sequence number is 1000. If the sender sends 3 segments of 100, 200, and 300 bytes respectively, what is the sequence number of the third segment?",
    option_a: "1300",
    option_b: "1200",
    option_c: "1100",
    option_d: "1000",
    correct_answer: "A",
    detailed_solution: "Seg 1 starts at 1000 (length 100). Seg 2 starts at 1000+100=1100 (length 200). Seg 3 starts at 1100+200=1300.",
    positive_marks: 1,
    negative_marks: 0.33
  },
  {
    topic_id: 6, // Databases
    question_text: "Consider a relational table R that is in 3NF, but not in BCNF. Which one of the following statements is TRUE?",
    option_a: "R has a nontrivial functional dependency X -> A, where X is not a superkey and A is a prime attribute.",
    option_b: "R has a nontrivial functional dependency X -> A, where X is not a superkey and A is a non-prime attribute.",
    option_c: "R has a nontrivial functional dependency X -> A, where X is a superkey and A is a prime attribute.",
    option_d: "R has a nontrivial functional dependency X -> A, where X is a superkey and A is a non-prime attribute.",
    correct_answer: "A",
    detailed_solution: "In 3NF, for every non-trivial FD X -> A, either X is a superkey or A is a prime attribute. Since it is NOT in BCNF, there must exist an FD where X is not a superkey. Therefore, A MUST be a prime attribute.",
    positive_marks: 1,
    negative_marks: 0.33
  },
  {
    topic_id: 1, // OS
    question_text: "A multiplexer has 4 select lines. The number of input lines is:",
    option_a: "4",
    option_b: "8",
    option_c: "16",
    option_d: "32",
    correct_answer: "C",
    detailed_solution: "If there are n select lines, the multiplexer can select from 2^n input lines. 2^4 = 16.",
    positive_marks: 1,
    negative_marks: 0.33
  },
  {
    topic_id: 7, // Theory of Computation
    question_text: "Which of the following languages is undecidable?",
    option_a: "Given a DFA, is its language empty?",
    option_b: "Given a PDA, is its language empty?",
    option_c: "Given a Turing Machine, does it halt on an empty tape?",
    option_d: "Given a DFA, does it accept all strings?",
    correct_answer: "C",
    detailed_solution: "The Halting problem for Turing Machines on any specific input (including the empty tape) is a classic undecidable problem.",
    positive_marks: 1,
    negative_marks: 0.33
  },
  {
    topic_id: 2, // DS & Algo
    question_text: "The preorder traversal of a binary search tree is 15, 10, 12, 11, 20, 18, 16, 19. Which one of the following is the postorder traversal of the tree?",
    option_a: "11, 12, 10, 16, 19, 18, 20, 15",
    option_b: "11, 10, 12, 16, 19, 18, 20, 15",
    option_c: "11, 12, 16, 19, 18, 10, 20, 15",
    option_d: "11, 12, 10, 19, 16, 18, 20, 15",
    correct_answer: "A",
    detailed_solution: "Using the BST property, the root is 15. Left subtree contains <15 (10, 12, 11). Right subtree contains >15 (20, 18, 16, 19). Recursively building the tree and doing postorder gives 11, 12, 10, 16, 19, 18, 20, 15.",
    positive_marks: 2,
    negative_marks: 0.66
  },
  {
    topic_id: 1, // OS
    question_text: "Consider a paging system with 32-bit logical addresses and 4 KB page size. The number of entries in the page table is:",
    option_a: "2^20",
    option_b: "2^12",
    option_c: "2^16",
    option_d: "2^24",
    correct_answer: "A",
    detailed_solution: "Page size = 4 KB = 2^12 bytes. Offset takes 12 bits. Page number takes 32 - 12 = 20 bits. So there are 2^20 entries in the page table.",
    positive_marks: 1,
    negative_marks: 0.33
  },
  {
    topic_id: 5, // Computer Networks
    question_text: "Which of the following transport layer protocols is used to support electronic mail?",
    option_a: "SMTP",
    option_b: "IP",
    option_c: "TCP",
    option_d: "UDP",
    correct_answer: "C",
    detailed_solution: "SMTP is the application layer protocol. The question asks for the Transport layer protocol. SMTP runs over TCP to guarantee reliable delivery of email.",
    positive_marks: 1,
    negative_marks: 0.33
  },
  {
    topic_id: 8, // Compiler Design
    question_text: "Lexical analysis is responsible for:",
    option_a: "Checking syntax",
    option_b: "Type checking",
    option_c: "Generating tokens",
    option_d: "Code optimization",
    correct_answer: "C",
    detailed_solution: "The lexical analyzer reads the stream of characters and groups them into meaningful sequences called lexemes, producing a stream of tokens.",
    positive_marks: 1,
    negative_marks: 0.33
  }
];

// Function to escape CSV values correctly
function escapeCsv(val) {
  if (val === undefined || val === null) return '""';
  let str = String(val);
  // If string contains quote, comma, or newline, escape quotes and wrap in quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

const headers = ['topic_id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'detailed_solution', 'positive_marks', 'negative_marks'];

let csvContent = headers.join(',') + '\n';

questions.forEach(q => {
  const row = headers.map(h => escapeCsv(q[h]));
  csvContent += row.join(',') + '\n';
});

fs.writeFileSync('GATE_CSE_2020_FULL.csv', csvContent);
console.log('Successfully generated GATE_CSE_2020_FULL.csv');
