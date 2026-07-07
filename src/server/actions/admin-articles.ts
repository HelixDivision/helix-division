"use server";

import { revalidatePath } from "next/cache";

import { articleSchema, articleTopicSchema } from "@/lib/validations/content";
import {
  errorMessage,
  fieldErrorsFrom,
  requireAdmin,
  type ActionResult,
} from "@/server/actions/shared";
import {
  createArticle,
  createArticleTopic,
  deleteArticle,
  deleteArticleTopic,
  updateArticle,
  updateArticleTopic,
  type ArticleWriteInput,
} from "@/server/services/articles";

/** Research Center admin actions (Phase 9.5). Role-checked; validate with content.ts; revalidate the whole tree (articles surface on /research and possibly the homepage). */

const NOT_AUTHORIZED: SaveArticleResult = { success: false, error: "Not authorized." };

export interface SaveArticleResult extends ActionResult {
  articleId?: string;
}

export async function saveArticleAction(
  articleId: string | null,
  input: unknown,
): Promise<SaveArticleResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;

  const parsed = articleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  const write: ArticleWriteInput = {
    ...parsed.data,
    scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : null,
  };

  try {
    const saved = articleId ? await updateArticle(articleId, write) : await createArticle(write);
    revalidatePath("/", "layout");
    return { success: true, articleId: saved.id };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function deleteArticleAction(articleId: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;
  try {
    await deleteArticle(articleId);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function saveArticleTopicAction(
  topicId: string | null,
  input: unknown,
): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;

  const parsed = articleTopicSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  try {
    if (topicId) {
      await updateArticleTopic(topicId, parsed.data);
    } else {
      await createArticleTopic(parsed.data);
    }
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function deleteArticleTopicAction(topicId: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;
  try {
    await deleteArticleTopic(topicId);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}
