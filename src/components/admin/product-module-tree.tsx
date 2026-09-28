"use client";

import { ChevronDown, ChevronRight, ChevronUp, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { LessonForm } from "@/components/admin/lesson-form";
import { ModuleForm } from "@/components/admin/module-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  deleteLessonAction,
  deleteModuleAction,
  moveLessonAction,
  moveModuleAction,
} from "@/core/products/actions";
import type { Lesson, ModuleWithLessons } from "@/core/products/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";
import type { QuizQuestion } from "@/lib/validations/products";

export function ProductModuleTree({
  productId,
  modules,
}: {
  productId: string;
  modules: ModuleWithLessons[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(modules.map((m) => m.id)));
  const [createModuleOpen, setCreateModuleOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleWithLessons | null>(null);
  const [creatingLessonFor, setCreatingLessonFor] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  function toggle(moduleId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  function handleSuccess() {
    setCreateModuleOpen(false);
    setEditingModule(null);
    setCreatingLessonFor(null);
    setEditingLesson(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{pt.products.tree.title}</h3>
        <Dialog open={createModuleOpen} onOpenChange={setCreateModuleOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="size-4" />
            {pt.products.tree.newModule}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{pt.products.tree.newModule}</DialogTitle>
            </DialogHeader>
            <ModuleForm mode="create" productId={productId} onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {modules.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {pt.products.tree.emptyModules}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {modules.map((module, moduleIndex) => (
            <div key={module.id} className="rounded-xl border">
              <div className="flex items-center gap-2 p-3">
                <button
                  type="button"
                  onClick={() => toggle(module.id)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  {expanded.has(module.id) ? (
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{module.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({module.lessons.length})
                  </span>
                </button>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={moduleIndex === 0}
                    onClick={() => moveModuleAction(module.id, "up").then(() => router.refresh())}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={moduleIndex === modules.length - 1}
                    onClick={() => moveModuleAction(module.id, "down").then(() => router.refresh())}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditingModule(module)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <ConfirmDeleteButton
                    confirmMessage={pt.products.tree.deleteModuleConfirm}
                    ariaLabel={pt.miniApps.admin.delete}
                    onDelete={() => deleteModuleAction(module.id)}
                  />
                </div>
              </div>

              {expanded.has(module.id) && (
                <div className="flex flex-col gap-2 border-t p-3">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="flex items-center gap-2 rounded-lg border p-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm">{lesson.name}</span>
                          <Badge variant="outline">{pt.products.contentTypes[lesson.content_type]}</Badge>
                          <Badge variant={lesson.status === "published" ? "default" : "secondary"}>
                            {pt.miniApps.status[lesson.status]}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={lessonIndex === 0}
                        onClick={() => moveLessonAction(lesson.id, "up").then(() => router.refresh())}
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={lessonIndex === module.lessons.length - 1}
                        onClick={() => moveLessonAction(lesson.id, "down").then(() => router.refresh())}
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditingLesson(lesson)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <ConfirmDeleteButton
                        confirmMessage={pt.products.tree.deleteLessonConfirm}
                        ariaLabel={pt.miniApps.admin.delete}
                        onDelete={() => deleteLessonAction(lesson.id)}
                      />
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => setCreatingLessonFor(module.id)}
                  >
                    <Plus className="size-4" />
                    {pt.products.tree.newLesson}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={editingModule !== null} onOpenChange={(open) => !open && setEditingModule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModule?.name}</DialogTitle>
          </DialogHeader>
          {editingModule && (
            <ModuleForm
              mode="edit"
              moduleId={editingModule.id}
              defaultValues={{
                name: editingModule.name,
                description: editingModule.description ?? "",
              }}
              onSuccess={handleSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      <Sheet
        open={creatingLessonFor !== null}
        onOpenChange={(open) => !open && setCreatingLessonFor(null)}
      >
        <SheetContent className="overflow-y-auto p-4">
          <SheetHeader className="p-0">
            <SheetTitle>{pt.products.tree.newLesson}</SheetTitle>
          </SheetHeader>
          {creatingLessonFor && (
            <LessonForm
              mode="create"
              moduleId={creatingLessonFor}
              productId={productId}
              onSuccess={handleSuccess}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={editingLesson !== null} onOpenChange={(open) => !open && setEditingLesson(null)}>
        <SheetContent className="overflow-y-auto p-4">
          <SheetHeader className="p-0">
            <SheetTitle>{editingLesson?.name}</SheetTitle>
          </SheetHeader>
          {editingLesson && (
            <LessonForm
              mode="edit"
              lessonId={editingLesson.id}
              defaultValues={{
                name: editingLesson.name,
                description: editingLesson.description ?? "",
                contentType: editingLesson.content_type,
                videoUrl: editingLesson.video_url ?? "",
                bodyText: editingLesson.body_text ?? "",
                imageUrl: editingLesson.image_url ?? "",
                fileUrl: editingLesson.file_url ?? "",
                linkUrl: editingLesson.link_url ?? "",
                quizData:
                  (editingLesson.quiz_data as { questions: QuizQuestion[] } | null) ?? {
                    questions: [],
                  },
                status: editingLesson.status,
                sortOrder: editingLesson.sort_order,
              }}
              onSuccess={handleSuccess}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
