"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createQuestion(formData: FormData) {
  const topic_id = formData.get("topic_id") as string;
  const question_text = formData.get("question_text") as string;
  const detailed_solution = formData.get("detailed_solution") as string;
  const positive_marks = parseFloat(formData.get("positive_marks") as string);
  const negative_marks = parseFloat(formData.get("negative_marks") as string);
  
  const optionsText = [
    formData.get("option_a") as string,
    formData.get("option_b") as string,
    formData.get("option_c") as string,
    formData.get("option_d") as string,
  ];
  
  const correctOptionIndex = parseInt(formData.get("correct_option") as string, 10); // 0, 1, 2, or 3

  // 1. Insert the Question
  const { data: question, error: questionError } = await supabase
    .from("questions")
    .insert({
      topic_id: parseInt(topic_id),
      question_text,
      detailed_solution,
      positive_marks,
      negative_marks,
      status: "PENDING_REVIEW", // Newly created questions go to review queue
    })
    .select()
    .single();

  if (questionError || !question) {
    console.error("Error inserting question:", questionError);
    throw new Error("Failed to create question");
  }

  // 2. Insert the Options
  const optionsToInsert = optionsText.map((text, index) => ({
    question_id: question.id,
    option_text: text,
    is_correct: index === correctOptionIndex
  }));

  const { error: optionsError } = await supabase
    .from("options")
    .insert(optionsToInsert);

  if (optionsError) {
    console.error("Error inserting options:", optionsError);
    // Ideally we'd rollback the question here, but Supabase JS doesn't support interactive transactions easily.
    // In production, we'd use a Postgres stored procedure.
    throw new Error("Failed to create options");
  }

  // Revalidate the cache so the list updates
  revalidatePath("/admin/questions");
  
  // Redirect back to the question bank
  redirect("/admin/questions");
}

export async function createTest(formData: FormData) {
  const title = formData.get("title") as string;
  const exam_id = formData.get("exam_id") as string;
  const duration_minutes = parseInt(formData.get("duration_minutes") as string, 10);
  const instructions = formData.get("instructions") as string;
  const status = formData.get("status") as string;

  const { error } = await supabase
    .from("tests")
    .insert({
      title,
      exam_id: parseInt(exam_id),
      duration_minutes,
      instructions,
      status
    });

  if (error) {
    console.error("Error creating test:", error);
    throw new Error("Failed to create test");
  }

  revalidatePath("/admin/tests");
  redirect("/admin/tests");
}
