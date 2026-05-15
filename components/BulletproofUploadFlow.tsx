"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function BulletproofUploadFlow() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zipCode, setZipCode] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"zip" | "upload" | "processing">("zip");

  useEffect(() => {
    return () => {
      if (uploadPreview) {
        URL.revokeObjectURL(uploadPreview);
      }
    };
  }, [uploadPreview]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image too large. Maximum size is 10MB.");
      return;
    }

    setError(null);
    setUploadedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setUploadPreview(previewUrl);
    setStep("upload");
  };

  const handleClear = () => {
    if (uploadPreview) {
      URL.revokeObjectURL(uploadPreview);
    }
    setUploadedFile(null);
    setUploadPreview(null);
    setStep("zip");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!zipCode.trim()) {
      setError("Please enter your ZIP code.");
      return;
    }

    if (!uploadedFile) {
      setError("Please select an image to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setStep("processing");

    try {
      const projectResponse = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip_code: zipCode }),
      });

      if (!projectResponse.ok) {
        const errText = await projectResponse.text();
        throw new Error(`Failed to create project: ${errText}`);
      }

      const projectData = await projectResponse.json();
      const projectId = projectData.id;

      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("project_id", projectId);

      const uploadResponse = await fetch("/api/projects/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text();
        throw new Error(`Upload failed: ${errText}`);
      }

      router.push(
        `/vision/start?from=${projectId}&zip=${encodeURIComponent(zipCode)}`
      );
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setIsUploading(false);
      setStep("upload");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-3xl border border-hairline bg-canvas-50 p-6 shadow-soft md:p-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-panel bg-canvas/80 px-4 py-2 mb-4">
            <Sparkles className="h-4 w-4 text-sand-dark" />
            <span className="text-sm font-semibold text-ink-600">
              Start your project
            </span>
          </div>
          <h2 className="font-display text-2xl tracking-tight text-ink md:text-3xl">
            Upload a photo, get a complete plan
          </h2>
          <p className="mt-2 text-ink-600">
            Our AI will analyze your space and create a renovation plan with
            estimates, materials, and visual concepts.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* ZIP Code Step */}
        {step === "zip" && (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="zip"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-ink"
              >
                <MapPin className="h-4 w-4 text-ink-500" />
                Your ZIP code
                <span className="text-ink-500 font-normal">(for local pricing)</span>
              </label>
              <input
                id="zip"
                type="text"
                value={zipCode}
                onChange={(e) =>
                  setZipCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))
                }
                placeholder="e.g., 10001"
                className="w-full rounded-2xl border border-hairline bg-canvas px-4 py-3.5 text-ink placeholder:text-ink-400 outline-none transition focus:border-sand focus:ring-2 focus:ring-sand/20"
                maxLength={5}
              />
            </div>

            <div
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                uploadPreview
                  ? "border-mint bg-mint/5"
                  : "border-canvas-300 bg-canvas hover:border-sand/40 hover:bg-sand/5"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              {uploadPreview ? (
                <div className="space-y-4">
                  <div className="relative mx-auto max-w-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadPreview}
                      alt="Preview"
                      className="w-full rounded-2xl shadow-soft"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                      className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-canvas-50 shadow-soft transition hover:opacity-90"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-mint">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium text-ink">Image selected</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sand/15">
                    <Upload className="h-7 w-7 text-sand-dark" />
                  </div>
                  <div>
                    <p className="font-medium text-ink">
                      Drag & drop a photo
                    </p>
                    <p className="mt-1 text-sm text-ink-500">
                      or click to browse
                    </p>
                  </div>
                  <p className="text-xs text-ink-400">
                    JPG, PNG, or WEBP &middot; Max 10MB
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (zipCode.length === 5 && uploadedFile) {
                  handleSubmit();
                } else if (zipCode.length === 5) {
                  fileInputRef.current?.click();
                } else {
                  setError("Please enter a valid 5-digit ZIP code.");
                }
              }}
              disabled={zipCode.length !== 5 || !uploadedFile}
              className="btn-primary w-full justify-center !py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
            >
              Start AI Analysis
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>

            <p className="text-center text-xs text-ink-400">
              By continuing, you agree to our Terms and Privacy Policy. Your
              photo is used only for analysis.
            </p>
          </div>
        )}

        {/* Upload Step (with ZIP already entered) */}
        {step === "upload" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-2xl border border-hairline bg-canvas p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-sand-dark" />
                <span className="text-sm font-medium text-ink">
                  ZIP: {zipCode}
                </span>
              </div>
              <button
                onClick={() => setStep("zip")}
                className="text-sm font-medium text-sand-dark hover:text-sand transition"
              >
                Change
              </button>
            </div>

            <div
              className="cursor-pointer rounded-2xl border-2 border-dashed border-mint bg-mint/5 p-8 text-center transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="space-y-4">
                <div className="relative mx-auto max-w-xs">
                  {uploadPreview && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={uploadPreview}
                        alt="Preview"
                        className="w-full rounded-2xl shadow-soft"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClear();
                        }}
                        className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-canvas-50 shadow-soft transition hover:opacity-90"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 text-mint">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium text-ink">
                    Image ready — start analysis below
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setStep("zip")}
                className="btn-ghost w-full justify-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!uploadedFile}
                className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Start AI Analysis
              </button>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === "processing" && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sand/15">
              <Loader2 className="h-8 w-8 animate-spin text-sand-dark" />
            </div>
            <h3 className="font-display text-xl tracking-tight text-ink mb-2">
              Creating your project...
            </h3>
            <p className="text-ink-600">This will just take a moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
