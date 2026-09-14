import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Save,
  Trash2,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Card,
  Field,
  Spinner,
  UploadButton,
} from "@/components/admin/ui";

import {
  adminHomepageQuery,
  adminSaveSetting,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_adminapp/admin/hero")({
  component: HeroPage,
});

type HeroSlide = {
  id?: string;
  video_url: string;
  poster_url?: string | null;
  heading?: string | null;
  subtitle?: string | null;
  primary_cta?: string | null;
  primary_link?: string | null;
  secondary_cta?: string | null;
  secondary_link?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function getString(
  value: Record<string, unknown>,
  key: string,
): string {
  return typeof value[key] === "string" ? value[key] as string : "";
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function HeroPage() {
  const queryClient = useQueryClient();

  const { data, isPending, error } = useQuery(adminHomepageQuery);

  const [heroKey, setHeroKey] = useState("hero");
  const [heroBase, setHeroBase] = useState<Record<string, unknown>>({});
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;

    const settings = data.settings ?? [];

    // Prefer "hero", otherwise automatically find a setting
    // that already contains video/hero data.
    const setting =
      settings.find((item) => item.key === "hero") ??
      settings.find((item) => {
        const value = asRecord(item.value);
        return (
          "video_url" in value ||
          "videos" in value
        );
      });

    if (!setting) {
      setHeroKey("hero");
      setHeroBase({});
      setSlides([]);
      return;
    }

    const base = asRecord(setting.value);

    setHeroKey(setting.key);
    setHeroBase(base);

    const rawVideos = Array.isArray(base.videos)
      ? base.videos
      : [];

    if (rawVideos.length > 0) {
      const parsed: HeroSlide[] = rawVideos
        .filter(
          (item) =>
            item &&
            typeof item === "object" &&
            typeof (item as Record<string, unknown>).video_url === "string",
        )
        .map((item) => {
          const video = item as Record<string, unknown>;

          return {
            id:
              typeof video.id === "string"
                ? video.id
                : makeId(),

            video_url: getString(video, "video_url"),
            poster_url: getString(video, "poster_url"),
            heading: getString(video, "heading"),
            subtitle: getString(video, "subtitle"),
            primary_cta: getString(video, "primary_cta"),
            primary_link: getString(video, "primary_link"),
            secondary_cta: getString(video, "secondary_cta"),
            secondary_link: getString(video, "secondary_link"),
          };
        });

      setSlides(parsed);
      return;
    }

    // Convert old single-video hero into the new slider format.
    const oldVideo = getString(base, "video_url");

    if (oldVideo) {
      setSlides([
        {
          id: makeId(),
          video_url: oldVideo,
          poster_url: getString(base, "poster_url"),
          heading: getString(base, "heading"),
          subtitle: getString(base, "subtitle"),
          primary_cta: getString(base, "primary_cta"),
          primary_link: getString(base, "primary_link"),
          secondary_cta: getString(base, "secondary_cta"),
          secondary_link: getString(base, "secondary_link"),
        },
      ]);
    } else {
      setSlides([]);
    }
  }, [data]);

  function updateSlide(
    index: number,
    patch: Partial<HeroSlide>,
  ) {
    setSlides((current) =>
      current.map((slide, i) =>
        i === index
          ? { ...slide, ...patch }
          : slide,
      ),
    );
  }

  function removeSlide(index: number) {
    setSlides((current) =>
      current.filter((_, i) => i !== index),
    );
  }

  function moveSlide(
    index: number,
    direction: "up" | "down",
  ) {
    setSlides((current) => {
      const next = [...current];

      const target =
        direction === "up"
          ? index - 1
          : index + 1;

      if (
        target < 0 ||
        target >= next.length
      ) {
        return current;
      }

      [next[index], next[target]] = [
        next[target],
        next[index],
      ];

      return next;
    });
  }

  async function saveHero() {
    setSaving(true);

    try {
      const videos = slides
        .filter((slide) => slide.video_url.trim())
        .map(({ id, ...slide }) => ({
          ...slide,
          video_url: slide.video_url.trim(),
          poster_url:
            slide.poster_url?.trim() || null,
          heading:
            slide.heading?.trim() || null,
          subtitle:
            slide.subtitle?.trim() || null,
          primary_cta:
            slide.primary_cta?.trim() || null,
          primary_link:
            slide.primary_link?.trim() || null,
          secondary_cta:
            slide.secondary_cta?.trim() || null,
          secondary_link:
            slide.secondary_link?.trim() || null,
        }));

      const value: Record<string, unknown> = {
        ...heroBase,

        // New slider data
        videos,

        // Clear old single-video field so removed slides
        // don't continue appearing through legacy fallback.
        video_url: null,
      };

      await adminSaveSetting({
        data: {
          key: heroKey,
          value,
        },
      });

      await queryClient.invalidateQueries({
        queryKey: ["admin", "homepage"],
      });

      toast.success("Hero videos saved successfully");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to save hero videos",
      );
    } finally {
      setSaving(false);
    }
  }

  if (isPending) {
    return <Spinner />;
  }

  if (error) {
    return (
      <Card>
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Failed to load hero settings"}
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-foreground md:text-3xl">
            Hero Video Manager
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Add, edit, reorder and remove homepage hero videos.
          </p>
        </div>

        <Button
          onClick={saveHero}
          disabled={saving}
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Hero"}
        </Button>
      </div>

      {/* Upload new videos */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-medium">
              Add Hero Videos
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Upload MP4/WebM videos. Maximum 100 MB per file.
            </p>
          </div>

          <UploadButton
            kind="hero"
            multiple
            accept="video/*"
            label="Upload videos"
            onUploaded={(files) => {
              setSlides((current) => [
                ...current,
                ...files.map((file) => ({
                  id: makeId(),
                  video_url: file.url,
                  poster_url: "",
                  heading: "",
                  subtitle: "",
                  primary_cta: "",
                  primary_link: "",
                  secondary_cta: "",
                  secondary_link: "",
                })),
              ]);
            }}
          />
        </div>
      </Card>

      {/* Slides */}
      <div className="space-y-5">
        {slides.length === 0 ? (
          <Card>
            <div className="py-10 text-center">
              <Video className="mx-auto h-10 w-10 text-muted-foreground" />

              <p className="mt-3 text-sm font-medium">
                No hero videos added
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Upload one or more videos above.
              </p>
            </div>
          </Card>
        ) : (
          slides.map((slide, index) => (
            <Card key={slide.id ?? index}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    Hero Slide {index + 1}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Video {index + 1} of {slides.length}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={index === 0}
                    onClick={() =>
                      moveSlide(index, "up")
                    }
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={
                      index === slides.length - 1
                    }
                    onClick={() =>
                      moveSlide(index, "down")
                    }
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      removeSlide(index)
                    }
                    title="Remove slide"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
                {/* Video preview */}
                <div>
                  <div className="overflow-hidden rounded-lg border bg-black">
                    <video
                      src={slide.video_url}
                      poster={
                        slide.poster_url || undefined
                      }
                      controls
                      muted
                      playsInline
                      className="aspect-video w-full object-cover"
                    />
                  </div>

                  <div className="mt-3">
                    <Field
                      label="Video URL"
                      hint="Uploaded video URL"
                    >
                      <Input
                        value={slide.video_url}
                        onChange={(e) =>
                          updateSlide(index, {
                            video_url:
                              e.target.value,
                          })
                        }
                      />
                    </Field>
                  </div>

                  <div className="mt-3">
                    <Field
                      label="Poster Image"
                      hint="Optional image shown before video loads"
                    >
                      <div className="flex flex-wrap gap-2">
                        <Input
                          value={
                            slide.poster_url ?? ""
                          }
                          placeholder="Poster image URL"
                          onChange={(e) =>
                            updateSlide(index, {
                              poster_url:
                                e.target.value,
                            })
                          }
                        />

                        <UploadButton
                          kind="hero"
                          accept="image/*"
                          label="Upload poster"
                          onUploaded={(files) => {
                            if (files[0]) {
                              updateSlide(index, {
                                poster_url:
                                  files[0].url,
                              });
                            }
                          }}
                        />
                      </div>
                    </Field>
                  </div>
                </div>

                {/* Text + CTA */}
                <div className="space-y-4">
                  <Field label="Heading">
                    <Input
                      value={slide.heading ?? ""}
                      placeholder="Luxury that defines you"
                      onChange={(e) =>
                        updateSlide(index, {
                          heading:
                            e.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Subtitle">
                    <Textarea
                      rows={3}
                      value={slide.subtitle ?? ""}
                      placeholder="Discover our latest jewellery collection."
                      onChange={(e) =>
                        updateSlide(index, {
                          subtitle:
                            e.target.value,
                        })
                      }
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Primary CTA">
                      <Input
                        value={
                          slide.primary_cta ?? ""
                        }
                        placeholder="Shop Now"
                        onChange={(e) =>
                          updateSlide(index, {
                            primary_cta:
                              e.target.value,
                          })
                        }
                      />
                    </Field>

                    <Field label="Primary Link">
                      <Input
                        value={
                          slide.primary_link ?? ""
                        }
                        placeholder="/collections"
                        onChange={(e) =>
                          updateSlide(index, {
                            primary_link:
                              e.target.value,
                          })
                        }
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Secondary CTA">
                      <Input
                        value={
                          slide.secondary_cta ?? ""
                        }
                        placeholder="Contact Us"
                        onChange={(e) =>
                          updateSlide(index, {
                            secondary_cta:
                              e.target.value,
                          })
                        }
                      />
                    </Field>

                    <Field label="Secondary Link">
                      <Input
                        value={
                          slide.secondary_link ?? ""
                        }
                        placeholder="/contact"
                        onChange={(e) =>
                          updateSlide(index, {
                            secondary_link:
                              e.target.value,
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {slides.length > 0 && (
        <div className="mt-6 flex justify-end">
          <Button
            onClick={saveHero}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Hero"}
          </Button>
        </div>
      )}
    </div>
  );
}