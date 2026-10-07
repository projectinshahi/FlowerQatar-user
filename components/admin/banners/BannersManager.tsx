"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Power, PowerOff, Save, Loader2 } from "lucide-react";
import BannerVideoUploader from "./BannerVideoUploader";
import { createBanner, updateBanner, deleteBanner, toggleBannerActive } from "@/lib/actions/banner.actions";

/** Storefront default when a banner has no colour of its own. */
const DEFAULT_BANNER_TEXT_COLOR = "#ffffff";

/**
 * Picking the default colour means "no colour", not "pin it to white" — so it is saved as an
 * empty string, which the schema turns into NULL. Otherwise a banner would be locked to white
 * even if the storefront default ever changed.
 */
const clearIfDefault = (v: string) =>
  v.toLowerCase() === DEFAULT_BANNER_TEXT_COLOR ? "" : v;

interface Banner {
  id: string;
  title: string | null;
  subheading: string | null;
  description: string | null;
  titleColor: string | null;
  subheadingColor: string | null;
  descriptionColor: string | null;
  videoUrl: string;
  videoPublicId: string | null;
  isActive: boolean;
  sortOrder: number;
}

export default function BannersManager({ initialBanners }: { initialBanners: Banner[] }) {
  const router = useRouter();

  // The client keeps its OWN authoritative list and mutates it optimistically from
  // each action's return value. This means added/edited/deleted banners appear
  // instantly and NEVER depend on router.refresh() succeeding (which can hang when
  // the DB connection pool is under load) — the previous cause of "can't add another".
  const [banners, setBanners] = useState<Banner[]>(initialBanners);

  // Re-sync when the server sends fresh props (e.g. after a successful refresh). Adjusted during
  // render rather than in an effect, so the stale list is never committed first.
  const [syncedBanners, setSyncedBanners] = useState(initialBanners);
  if (syncedBanners !== initialBanners) {
    setSyncedBanners(initialBanners);
    setBanners(initialBanners);
  }

  // New banner form — own pending flag, isolated from row operations.
  const [newTitle, setNewTitle] = useState("");
  const [newSubheading, setNewSubheading] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newVideo, setNewVideo] = useState<{ url: string; publicId: string } | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (creating) return;
    if (!newVideo?.url) {
      toast.error("Please upload a video first.");
      return;
    }
    setCreating(true);
    try {
      const res = await createBanner({
        title: newTitle || null,
        subheading: newSubheading || null,
        description: newDescription || null,
        videoUrl: newVideo.url,
        videoPublicId: newVideo.publicId,
        isActive: true,
        sortOrder: banners.length,
      });
      if (res?.success === false) {
        toast.error(res.error || "Failed to add banner");
        return;
      }
      // Optimistically add the returned banner so it shows immediately.
      setBanners((prev) => [...prev, res.data as Banner]);
      toast.success("Banner added");
      setNewTitle("");
      setNewSubheading("");
      setNewDescription("");
      setNewVideo(null);
      router.refresh();
    } catch (e) {
      toast.error((e instanceof Error && e.message) || "Failed to add banner");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdated = (updated: Banner) =>
    setBanners((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  const handleToggled = (id: string, isActive: boolean) =>
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, isActive } : b)));
  const handleDeleted = (id: string) => setBanners((prev) => prev.filter((b) => b.id !== id));

  const hasBanner = banners.length >= 1;

  return (
    <div className="space-y-8">
      {/* Add new banner — only one banner is allowed, so hide this once one exists. */}
      {hasBanner ? (
        <section className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
          Only one banner is allowed. Edit its heading/description, replace its video, or delete it below to add a different one.
        </section>
      ) : (
      <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Banner Video</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <BannerVideoUploader
              value={newVideo?.url}
              onUploaded={(url, publicId) => setNewVideo({ url, publicId })}
              onRemove={() => setNewVideo(null)}
            />
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title (heading)</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Summer Collection"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subheading</label>
              <input
                value={newSubheading}
                onChange={(e) => setNewSubheading(e.target.value)}
                placeholder="e.g. Preserved Eternity Roses"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
                placeholder="Short description shown under the heading…"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none text-sm resize-none"
              />
            </div>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !newVideo?.url}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed w-fit"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {creating ? "Adding…" : "Add Banner"}
            </button>
          </div>
        </div>
      </section>
      )}

      {/* Existing banner */}
      <section>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Banner</h3>
        {banners.length === 0 ? (
          <div className="text-center py-12 bg-white border border-dashed border-gray-200 rounded-xl text-gray-500 text-sm">
            No banners yet. Upload your first banner video above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((b) => (
              <BannerRow
                key={b.id}
                banner={b}
                onUpdated={handleUpdated}
                onToggled={handleToggled}
                onDeleted={handleDeleted}
                refresh={() => router.refresh()}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BannerRow({
  banner,
  onUpdated,
  onToggled,
  onDeleted,
  refresh,
}: {
  banner: Banner;
  onUpdated: (b: Banner) => void;
  onToggled: (id: string, isActive: boolean) => void;
  onDeleted: (id: string) => void;
  refresh: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(banner.title || "");
  const [subheading, setSubheading] = useState(banner.subheading || "");
  const [description, setDescription] = useState(banner.description || "");
  const [titleColor, setTitleColor] = useState(banner.titleColor || DEFAULT_BANNER_TEXT_COLOR);
  const [subheadingColor, setSubheadingColor] = useState(
    banner.subheadingColor || DEFAULT_BANNER_TEXT_COLOR
  );
  const [descriptionColor, setDescriptionColor] = useState(
    banner.descriptionColor || DEFAULT_BANNER_TEXT_COLOR
  );

  // Keep local edit fields in sync if the banner prop changes underneath us (adjusted during
  // render, keyed on exactly the fields the effect used to depend on).
  const sourceKey = JSON.stringify([
    banner.title,
    banner.subheading,
    banner.description,
    banner.titleColor,
    banner.subheadingColor,
    banner.descriptionColor,
  ]);
  const [syncedKey, setSyncedKey] = useState(sourceKey);
  if (syncedKey !== sourceKey) {
    setSyncedKey(sourceKey);
    setTitle(banner.title || "");
    setSubheading(banner.subheading || "");
    setDescription(banner.description || "");
    setTitleColor(banner.titleColor || DEFAULT_BANNER_TEXT_COLOR);
    setSubheadingColor(banner.subheadingColor || DEFAULT_BANNER_TEXT_COLOR);
    setDescriptionColor(banner.descriptionColor || DEFAULT_BANNER_TEXT_COLOR);
  }

  const dirty =
    title !== (banner.title || "") ||
    subheading !== (banner.subheading || "") ||
    description !== (banner.description || "") ||
    titleColor !== (banner.titleColor || DEFAULT_BANNER_TEXT_COLOR) ||
    subheadingColor !== (banner.subheadingColor || DEFAULT_BANNER_TEXT_COLOR) ||
    descriptionColor !== (banner.descriptionColor || DEFAULT_BANNER_TEXT_COLOR);

  // Row-level runner: guards against thrown errors and updates local state on success.
  const run = (
    fn: () => Promise<{ success: boolean; error?: string; data?: unknown }>,
    okMsg: string,
    onSuccess?: (data: unknown) => void
  ) =>
    startTransition(async () => {
      try {
        const res = await fn();
        if (res?.success === false) {
          toast.error(res.error || "Something went wrong");
          return;
        }
        toast.success(okMsg);
        onSuccess?.(res.data);
        refresh();
      } catch (e) {
        toast.error((e instanceof Error && e.message) || "Something went wrong");
      }
    });

  const saveText = () =>
    run(
      () =>
        updateBanner(banner.id, {
          title: title || null,
          subheading: subheading || null,
          description: description || null,
          // Sending "" clears the column so the storefront falls back to white; sending the
          // default hex would pin it, which is a different thing.
          titleColor: clearIfDefault(titleColor),
          subheadingColor: clearIfDefault(subheadingColor),
          descriptionColor: clearIfDefault(descriptionColor),
          videoUrl: banner.videoUrl,
          videoPublicId: banner.videoPublicId,
          isActive: banner.isActive,
          sortOrder: banner.sortOrder,
        }),
      "Banner updated",
      (data) => onUpdated(data as Banner)
    );

  const replaceVideo = (url: string, publicId: string) =>
    run(
      () =>
        updateBanner(banner.id, {
          title: banner.title,
          subheading: banner.subheading,
          description: banner.description,
          titleColor: banner.titleColor,
          subheadingColor: banner.subheadingColor,
          descriptionColor: banner.descriptionColor,
          videoUrl: url,
          videoPublicId: publicId,
          isActive: banner.isActive,
          sortOrder: banner.sortOrder,
        }),
      "Video replaced",
      (data) => onUpdated(data as Banner)
    );

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <BannerVideoUploader value={banner.videoUrl} onUploaded={replaceVideo} />
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Heading (title)"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm font-medium"
          />
          <input
            value={subheading}
            onChange={(e) => setSubheading(e.target.value)}
            placeholder="Subheading"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Description"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 outline-none text-sm resize-none"
          />
          {/* Copy colours + live preview. Each text element gets its own colour, and the
              preview reuses the banner's own video and the storefront's gradient so the
              admin judges them against the real backdrop — a row of swatches would hide a
              legibility problem, and hide it differently for each line. */}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <span className="block text-xs font-medium text-gray-700">Text colours</span>
            <div className="flex flex-wrap items-end gap-3">
              <BannerColorField
                id={`title-color-${banner.id}`}
                label="Heading"
                value={titleColor}
                onChange={setTitleColor}
              />
              <BannerColorField
                id={`subheading-color-${banner.id}`}
                label="Subheading"
                value={subheadingColor}
                onChange={setSubheadingColor}
              />
              <BannerColorField
                id={`description-color-${banner.id}`}
                label="Description"
                value={descriptionColor}
                onChange={setDescriptionColor}
              />
              {[titleColor, subheadingColor, descriptionColor].some(
                (c) => c.toLowerCase() !== DEFAULT_BANNER_TEXT_COLOR
              ) && (
                <button
                  type="button"
                  onClick={() => {
                    setTitleColor(DEFAULT_BANNER_TEXT_COLOR);
                    setSubheadingColor(DEFAULT_BANNER_TEXT_COLOR);
                    setDescriptionColor(DEFAULT_BANNER_TEXT_COLOR);
                  }}
                  className="pb-1.5 text-xs text-gray-500 underline hover:text-gray-900"
                >
                  Reset all
                </button>
              )}
            </div>

            <div className="relative h-28 w-full overflow-hidden rounded-lg bg-gray-900">
              <video
                src={banner.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
                aria-hidden
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center gap-0.5 px-4">
                {title && (
                  <span className="font-serif text-base leading-tight" style={{ color: titleColor }}>
                    {title}
                  </span>
                )}
                {subheading && (
                  <span
                    className="font-sans text-[8px] uppercase tracking-[0.2em]"
                    style={{ color: subheadingColor }}
                  >
                    {subheading}
                  </span>
                )}
                {description && (
                  <span
                    className="font-sans text-[9px] leading-snug line-clamp-2"
                    style={{ color: descriptionColor }}
                  >
                    {description}
                  </span>
                )}
                {!title && !subheading && !description && (
                  <span className="font-serif text-base text-white/70">Preview</span>
                )}
              </div>
            </div>
          </div>

          {dirty && (
            <button
              type="button"
              onClick={saveText}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50"
              title="Save changes"
            >
              <Save size={14} /> Save changes
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
              banner.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {banner.isActive ? "Active" : "Inactive"}
          </span>
          <div className="flex items-center gap-1.5">
            {banner.isActive ? (
              <button
                type="button"
                onClick={() => run(() => toggleBannerActive(banner.id, false), "Banner disabled", () => onToggled(banner.id, false))}
                disabled={isPending}
                className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-md"
                title="Disable"
              >
                <PowerOff size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => run(() => toggleBannerActive(banner.id, true), "Banner enabled", () => onToggled(banner.id, true))}
                disabled={isPending}
                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md"
                title="Enable"
              >
                <Power size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this banner?")) run(() => deleteBanner(banner.id), "Banner deleted", () => onDeleted(banner.id));
              }}
              disabled={isPending}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Colour picker paired with a hex field, so a brand colour can be pasted as well as picked. */
function BannerColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const valid = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[11px] font-medium text-gray-600">
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <input
          id={id}
          type="color"
          value={valid ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-9 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          aria-label={`${label} hex value`}
          aria-invalid={!valid}
          className={`w-[86px] rounded-lg border px-2 py-1 font-mono text-xs uppercase outline-none focus:ring-1 focus:ring-gray-900 ${
            valid ? "border-gray-200" : "border-red-300 bg-red-50"
          }`}
        />
      </div>
    </div>
  );
}
