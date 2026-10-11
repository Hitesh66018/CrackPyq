import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import Papa from "papaparse";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    
    // Parse CSV
    const { data, errors } = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      return NextResponse.json({ error: "Invalid CSV format" }, { status: 400 });
    }

    let successCount = 0;

    // Process each row
    for (const row of data as any[]) {
      // Basic validation
      if (!row.topic_id || !row.question_text || !row.correct_answer) continue;

      // 1. Insert Question (as DRAFT/PENDING_REVIEW based on the new plan)
      const { data: qData, error: qError } = await supabase
        .from("questions")
        .insert({
          topic_id: parseInt(row.topic_id),
          exam_year: row.exam_year ? parseInt(row.exam_year) : null,
          question_text: row.question_text,
          detailed_solution: row.detailed_solution || "",
          positive_marks: parseFloat(row.positive_marks || "4"),
          negative_marks: parseFloat(row.negative_marks || "1"),
          status: "PENDING_REVIEW"
        })
        .select()
        .single();

      if (qError || !qData) {
        console.error("Failed to insert question:", qError);
        continue;
      }

      // 2. Map Correct Answer ('A', 'B', 'C', 'D') to index
      const correctIdxMap: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
      const correctIdx = correctIdxMap[(row.correct_answer || '').toUpperCase()] ?? 0;

      // 3. Insert Options
      const options = [
        { question_id: qData.id, option_text: row.option_a || "", is_correct: correctIdx === 0 },
        { question_id: qData.id, option_text: row.option_b || "", is_correct: correctIdx === 1 },
        { question_id: qData.id, option_text: row.option_c || "", is_correct: correctIdx === 2 },
        { question_id: qData.id, option_text: row.option_d || "", is_correct: correctIdx === 3 },
      ];

      await supabase.from("options").insert(options);
      successCount++;
    }

    return NextResponse.json({ 
      message: `Successfully imported ${successCount} questions for review.` 
    });

  } catch (error: any) {
    console.error("Bulk import failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
