const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function seedTaxonomy() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Seeding Phase 2 Exam Families and Catalog...');

    // 1. Seed Categories (Exam Families)
    const families = [
      { code: 'ENG', name: 'Engineering Entrance', desc: 'GATE, JEE Main, JEE Advanced' },
      { code: 'MED', name: 'Medical Entrance', desc: 'NEET-UG, AIIMS' },
      { code: 'GOV_SSC', name: 'Staff Selection Commission', desc: 'SSC CGL, CHSL, CPO, MTS' },
      { code: 'CIVIL', name: 'Civil Services', desc: 'UPSC Civil Services Examination' },
    ];

    const familyIdMap = {};
    for (const f of families) {
      // Check if category exists by name first
      let res = await client.query(`SELECT id FROM categories WHERE name = $1`, [f.name]);
      if (res.rows.length > 0) {
        await client.query(`UPDATE categories SET code = $1, description = $2 WHERE id = $3`, [f.code, f.desc, res.rows[0].id]);
        familyIdMap[f.code] = res.rows[0].id;
      } else {
        res = await client.query(`
          INSERT INTO categories (code, name, description)
          VALUES ($1, $2, $3)
          RETURNING id;
        `, [f.code, f.name, f.desc]);
        familyIdMap[f.code] = res.rows[0].id;
      }
    }

    // 2. Seed Exams Catalog
    const exams = [
      // Engineering
      { code: 'GATE_CS', name: 'GATE Computer Science & IT', family: 'ENG', status: 'READY_FOR_IMPORT' },
      { code: 'GATE_DA', name: 'GATE Data Science & AI', family: 'ENG', status: 'PLANNED' },
      { code: 'GATE_EC', name: 'GATE Electronics & Communication', family: 'ENG', status: 'PLANNED' },
      { code: 'GATE_EE', name: 'GATE Electrical Engineering', family: 'ENG', status: 'PLANNED' },
      { code: 'GATE_ME', name: 'GATE Mechanical Engineering', family: 'ENG', status: 'PLANNED' },
      { code: 'JEE_MAIN', name: 'JEE Main', family: 'ENG', status: 'CONFIGURING' },
      { code: 'JEE_ADV', name: 'JEE Advanced', family: 'ENG', status: 'PLANNED' },
      // Medical
      { code: 'NEET_UG', name: 'NEET-UG', family: 'MED', status: 'CONFIGURING' },
      // SSC
      { code: 'SSC_CGL', name: 'SSC CGL', family: 'GOV_SSC', status: 'PLANNED' },
      { code: 'SSC_CHSL', name: 'SSC CHSL', family: 'GOV_SSC', status: 'PLANNED' },
      { code: 'SSC_CPO', name: 'SSC CPO', family: 'GOV_SSC', status: 'PLANNED' },
      { code: 'SSC_MTS', name: 'SSC MTS', family: 'GOV_SSC', status: 'PLANNED' },
      // Civil Services
      { code: 'UPSC_CSE', name: 'UPSC Civil Services Examination', family: 'CIVIL', status: 'PLANNED' },
    ];

    const examIdMap = {};
    for (const e of exams) {
      const res = await client.query(`
        INSERT INTO exams (code, name, category_id, status)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, status = EXCLUDED.status
        RETURNING id;
      `, [e.code, e.name, familyIdMap[e.family], e.status]);
      examIdMap[e.code] = res.rows[0].id;
    }

    // 3. Seed GATE CSE Official Subjects & Topics
    const gateCsId = examIdMap['GATE_CS'];
    console.log(`Seeding official GATE CSE (ID: ${gateCsId}) taxonomy...`);

    const gateCsTaxonomy = [
      {
        code: 'GCS_EM',
        name: 'Engineering Mathematics',
        topics: [
          'Discrete Mathematics (Propositional & First Order Logic, Sets, Relations, Functions, Partial Orders, Lattices, Groups)',
          'Combinatorics (Counting, Recurrence Relations, Generating Functions)',
          'Graph Theory (Connectivity, Matching, Coloring)',
          'Linear Algebra (Matrices, Determinants, System of Linear Equations, Eigenvalues & Eigenvectors, LU Decomposition)',
          'Calculus (Limits, Continuity, Differentiability, Maxima & Minima, Mean Value Theorem, Integration)',
          'Probability & Statistics (Random Variables, Uniform, Normal, Exponential, Poisson, Binomial, Conditional Probability, Bayes Theorem)'
        ]
      },
      {
        code: 'GCS_DL',
        name: 'Digital Logic',
        topics: [
          'Boolean Algebra & Logic Gates',
          'Combinational Circuits (Adders, Multiplexers, Decoders)',
          'Sequential Circuits (Latches, Flip-Flops, Registers, Counters, State Machines)',
          'Number Representations & Computer Arithmetic'
        ]
      },
      {
        code: 'GCS_COA',
        name: 'Computer Organization & Architecture',
        topics: [
          'Machine Instructions & Addressing Modes',
          'ALU, Data-Path & Control Unit Design',
          'Instruction Pipelining & Hazards',
          'Memory Hierarchy (Cache Mapping, Replacement Policies, Main Memory, Virtual Memory)',
          'I/O Interface (Interrupt and DMA Mode)'
        ]
      },
      {
        code: 'GCS_PDS',
        name: 'Programming & Data Structures',
        topics: [
          'Programming in C (Recursion, Arrays, Pointers, Structures)',
          'Stacks & Queues',
          'Linked Lists',
          'Trees (Binary Trees, BST, AVL Trees, Heaps)',
          'Graphs & Representation'
        ]
      },
      {
        code: 'GCS_ALGO',
        name: 'Algorithms',
        topics: [
          'Asymptotic Analysis & Recurrences',
          'Divide and Conquer (Sorting, Searching)',
          'Greedy Algorithms (MST, Huffman, Dijkstra)',
          'Dynamic Programming (LCS, Matrix Chain, Knapsack)',
          'Graph Traversals & Shortest Paths (BFS, DFS, Bellman-Ford, Floyd-Warshall)',
          'NP-Completeness & Complexity Classes'
        ]
      },
      {
        code: 'GCS_TOC',
        name: 'Theory of Computation',
        topics: [
          'Regular Expressions & Finite Automata (DFA, NFA, Minimization)',
          'Context-Free Grammars & Push-Down Automata',
          'Regular & Context-Free Languages (Pumping Lemma, Closure Properties)',
          'Turing Machines & Undecidability (Halting Problem, Rice Theorem)'
        ]
      },
      {
        code: 'GCS_CD',
        name: 'Compiler Design',
        topics: [
          'Lexical Analysis & Regular Expressions',
          'Parsing (LL, LR, LALR, CLR)',
          'Syntax-Directed Translation (SDT)',
          'Intermediate Code Generation (Three-Address Code)',
          'Runtime Environments & Symbol Tables',
          'Code Optimization & Data Flow Analysis'
        ]
      },
      {
        code: 'GCS_OS',
        name: 'Operating Systems',
        topics: [
          'System Calls, Processes & Threads',
          'CPU Scheduling Algorithms',
          'Process Synchronization & Deadlocks (Semaphores, Bankers Algorithm)',
          'Memory Management & Paging (Page Replacement, Segmentation, Thrashing)',
          'File Systems & Disk Scheduling (SCAN, C-SCAN, SSTF)'
        ]
      },
      {
        code: 'GCS_DBMS',
        name: 'Databases (DBMS)',
        topics: [
          'ER-Model & Relational Algebra',
          'SQL Queries & Constraints',
          'Relational Database Design & Normalization (1NF, 2NF, 3NF, BCNF)',
          'Transactions & Concurrency Control (ACID, Serializability, 2PL, Lock-based Protocols)',
          'File Structures & Indexing (B-Trees, B+ Trees, Hashing)'
        ]
      },
      {
        code: 'GCS_CN',
        name: 'Computer Networks',
        topics: [
          'OSI & TCP/IP Layering Architecture',
          'Data Link Layer (Framing, Error Detection, Flow Control, Sliding Window, CSMA/CD)',
          'Network Layer & Routing Algorithms (IPv4, IPv6, Subnetting, CIDR, OSPF, BGP, Distance Vector)',
          'Transport Layer Protocols (TCP, UDP, Congestion Control, Flow Control)',
          'Application Layer (DNS, SMTP, POP, FTP, HTTP, HTTPS)',
          'Network Security Basics (RSA, Symmetric/Asymmetric, Firewalls)'
        ]
      },
      {
        code: 'GCS_GA',
        name: 'General Aptitude',
        topics: [
          'Verbal Ability (Grammar, Vocabulary, Reading Comprehension)',
          'Quantitative Aptitude (Data Interpretation, Numerical Computation, Estimation)',
          'Analytical Aptitude (Logic, Deduction, Induction)',
          'Spatial Aptitude (Transformation, Patterns, Paper Folding)'
        ]
      }
    ];

    let totalSubjects = 0;
    let totalTopics = 0;

    for (const [sIdx, sub] of gateCsTaxonomy.entries()) {
      const subRes = await client.query(`
        INSERT INTO subjects (exam_id, code, name, display_order)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, display_order = EXCLUDED.display_order
        RETURNING id;
      `, [gateCsId, sub.code, sub.name, sIdx + 1]);
      const subId = subRes.rows[0].id;
      totalSubjects++;

      for (const [tIdx, topName] of sub.topics.entries()) {
        const topCode = `${sub.code}_T${tIdx + 1}`;
        await client.query(`
          INSERT INTO topics (subject_id, code, name, display_order)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, display_order = EXCLUDED.display_order;
        `, [subId, topCode, topName, tIdx + 1]);
        totalTopics++;
      }
    }

    // 4. Seed GATE CSE Sample Past Exam Papers (2010 to 2024)
    console.log('Seeding GATE CSE historical exam papers metadata (2010 - 2024)...');
    for (let yr = 2010; yr <= 2024; yr++) {
      const pCode = `GATE_CS_${yr}`;
      await client.query(`
        INSERT INTO exam_papers (exam_id, year, session_name, code, total_marks, duration_minutes)
        VALUES ($1, $2, 'Official Question Paper', $3, 100, 180)
        ON CONFLICT (code) DO UPDATE SET session_name = EXCLUDED.session_name;
      `, [gateCsId, yr, pCode]);
    }

    await client.query('COMMIT');
    console.log(`\n🎉 SEED SUCCESSFUL!`);
    console.log(`- Exam Families: ${families.length}`);
    console.log(`- Catalog Exams: ${exams.length}`);
    console.log(`- GATE CSE Official Subjects: ${totalSubjects}`);
    console.log(`- GATE CSE Official Topics: ${totalTopics}`);
    console.log(`- GATE CSE Exam Papers (2010-2024): 15 years configured`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedTaxonomy();
