const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('sample_exam.pdf'));

doc.fontSize(20).text('GATE 2021 Computer Science and Information Technology', { align: 'center' });
doc.moveDown();
doc.fontSize(12).text('Instructions: Choose the correct option. Negative marking applies.', { align: 'center' });
doc.moveDown(2);

doc.fontSize(14).text('Q1. Which of the following page replacement algorithms suffers from Belady\'s Anomaly?');
doc.fontSize(12).moveDown(0.5);
doc.text('(A) Optimal Page Replacement');
doc.text('(B) LRU');
doc.text('(C) FIFO');
doc.text('(D) Both LRU and FIFO');
doc.moveDown();

doc.fontSize(14).text('Q2. Consider the following recurrence relation: T(n) = 2T(n/2) + O(n). What is the time complexity?');
doc.fontSize(12).moveDown(0.5);
doc.text('(A) O(n)');
doc.text('(B) O(n log n)');
doc.text('(C) O(n^2)');
doc.text('(D) O(log n)');
doc.moveDown();

doc.fontSize(14).text('Q3. In a standard Ethernet network, what is the minimum frame size?');
doc.fontSize(12).moveDown(0.5);
doc.text('(A) 32 bytes');
doc.text('(B) 64 bytes');
doc.text('(C) 128 bytes');
doc.text('(D) 256 bytes');
doc.moveDown();

doc.fontSize(14).text('Q4. Let R(A, B, C, D) be a relational schema with functional dependencies: A -> B, B -> C, C -> D. Which normal form is R in?');
doc.fontSize(12).moveDown(0.5);
doc.text('(A) 1NF only');
doc.text('(B) 2NF only');
doc.text('(C) 3NF but not BCNF');
doc.text('(D) BCNF');

doc.end();
console.log("PDF generated successfully!");
