import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { QuizRenderer } from "@/components/lessons/quiz-renderer";
import { VideoPlayer } from "@/components/lessons/video-player";
import { Button } from "@/components/ui/button";
import type { Lesson } from "@/core/products/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";
import type { QuizQuestion } from "@/lib/validations/products";

export function LessonContentRenderer({ lesson }: { lesson: Lesson }) {
  switch (lesson.content_type) {
    case "video":
      return lesson.video_url ? <VideoPlayer url={lesson.video_url} title={lesson.name} /> : null;

    case "text":
      return <p className="whitespace-pre-wrap text-sm leading-relaxed">{lesson.body_text}</p>;

    case "image":
      // Admin-pasted external URL — plain <img>, not next/image, same
      // reasoning as mini-app-card.tsx (avoids configuring
      // images.remotePatterns for arbitrary hosts).
      // eslint-disable-next-line @next/next/no-img-element
      return lesson.image_url ? (
        <img src={lesson.image_url} alt={lesson.name} className="w-full rounded-xl border" />
      ) : null;

    case "pdf":
      // Same trust model as mini_apps' `iframe` type — browser-native PDF
      // rendering, never sandboxed.
      return lesson.file_url ? (
        <iframe src={lesson.file_url} className="h-[75vh] w-full rounded-xl border" title={lesson.name} />
      ) : null;

    case "audio":
      return lesson.file_url ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio controls src={lesson.file_url} className="w-full" />
      ) : null;

    case "file":
      return lesson.file_url ? (
        <Button render={<Link href={lesson.file_url} target="_blank" rel="noopener noreferrer" />}>
          <ExternalLink className="size-4" />
          {pt.apps.detail.openExternalButton}
        </Button>
      ) : null;

    case "link":
      return lesson.link_url ? (
        <Button render={<Link href={lesson.link_url} target="_blank" rel="noopener noreferrer" />}>
          <ExternalLink className="size-4" />
          {pt.apps.detail.openExternalButton}
        </Button>
      ) : null;

    case "quiz": {
      const quizData = lesson.quiz_data as { questions: QuizQuestion[] } | null;
      return quizData?.questions?.length ? (
        <QuizRenderer questions={quizData.questions} />
      ) : null;
    }

    default:
      return null;
  }
}
