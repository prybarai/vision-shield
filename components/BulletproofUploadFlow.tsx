"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";

export default function BulletproofUploadFlow() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zipCode, setZipCode] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"zip" | "upload" | "processing">("zip");

  // Clean up object URLs on unmount
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

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WEBP image.");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image too large. Maximum size is 10MB.");
      return;
    }

    setError(null);
    setUploadedFile(file);

    // Create preview
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
      // STEP 1: Create project
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

      // STEP 2: Upload image
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

      const uploadData = await uploadResponse.json();

      // STEP 3: Redirect to vision start
      router.push(`/vision/start?from=${projectId}&zip=${encodeURIComponent(zipCode)}`);

    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsUploading(false);
      setStep("upload");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Start your project</h2>
          <p className="text-gray-600">Upload a photo and get an AI-powered plan in minutes</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* ZIP Code Step */}
        {step === "zip" && (
          <div className="space-y-6">
            <div>
              <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-2">
                Your ZIP code
              </label>
              <input
                id="zip"
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
                placeholder="e.g., 10001"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sand focus:border-sand outline-none transition"
                maxLength={5}
              />
              <p className="mt-2 text-sm text-gray-500">
                Used for accurate local pricing and contractor matching
              </p>
            </div>

            <Button
              onClick={() => setStep("upload")}
              disabled={zipCode.length !== 5}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Upload Step */}
        {step === "upload" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">ZIP code: {zipCode}</h3>
                <button
                  onClick={() => setStep("zip")}
                  className="text-sm text-sand-dark hover:text-sand-darker mt-1"
                >
                  Change
                </button>
              </div>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
                uploadPreview
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 hover:border-gray-400 bg-gray-50"
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
                    <img
                      src={uploadPreview}
                      alt="Preview"
                      className="w-full h-auto rounded-lg shadow"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Image selected</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-sand/20 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-sand-dark" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Click to upload a photo</p>
                    <p className="text-sm text-gray-500 mt-1">
                      JPG, PNG, or WEBP • Max 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setStep("zip")}
                variant="outline"
                className="w-full"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!uploadedFile}
                className="w-full"
              >
                Start AI Analysis
              </Button>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === "processing" && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-sand border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Creating your project...</h3>
            <p className="text-gray-600">This will just take a moment</p>
          </div>
        )}
      </div>
    </div>
  );
}