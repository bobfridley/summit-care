import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Image as ImageIcon, FileText } from "lucide-react";
import { summitCareMarkColor, summitCareMarkMonoDark, summitCareHorizontalColor } from "@/components/brand/LogoAssets";
import { summitCareSidebarBadge, dashboardOverlaySquarePen } from "@/components/brand/LogoAssets";

function Preview({ svg, bgClass }) {
  return (
    <div
      className={`w-full h-48 ${bgClass || "bg-white"} border border-stone-200 rounded-lg flex items-center justify-center overflow-hidden`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function downloadSVG(filename, svgString) {
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadPNG(filename, svgString, width) {
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    const ratio = img.naturalHeight / img.naturalWidth;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = Math.round(width * ratio);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      const pngUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `${filename}-${width}w.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(pngUrl);
      URL.revokeObjectURL(url);
    }, "image/png");
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    alert("Failed to render PNG. Please try SVG download instead.");
  };
  img.src = url;
}

const variants = [
  {
    key: "horizontal-color",
    title: "Logo — Horizontal (Color)",
    svg: summitCareHorizontalColor,
    suggestedName: "summitcare-logo-horizontal-color"
  },
  {
    key: "mark-color",
    title: "Logo Mark — Icon (Color)",
    svg: summitCareMarkColor,
    suggestedName: "summitcare-logo-mark-color"
  },
  {
    key: "mark-mono-dark",
    title: "Logo Mark — Icon (Monochrome Dark)",
    svg: summitCareMarkMonoDark,
    suggestedName: "summitcare-logo-mark-mono-dark"
  },
  {
    key: "sidebar-badge",
    title: "App Badge — Sidebar",
    svg: summitCareSidebarBadge,
    suggestedName: "summitcare-app-badge"
  },
  {
    key: "overlay-square-pen",
    title: "Overlay Icon — Square Pen (White)",
    svg: dashboardOverlaySquarePen,
    suggestedName: "overlay-square-pen-white",
    bgClass: "bg-slate-800"
  }
];

export default function BrandAssets() {
  const [pngSize, setPngSize] = useState("1024");

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-primary-blue" />
              SummitCare Brand Assets
            </h1>
            <p className="text-text-secondary mt-1">Download official SummitCare logos in SVG and PNG formats.</p>
          </div>
        </div>

        <Card className="alpine-card border-0 shadow-lg">
          <CardHeader className="border-b border-stone-100">
            <CardTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-secondary-green" />
              PNG Export Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-sm text-text-primary font-medium">PNG Width</div>
              <Select value={pngSize} onValueChange={setPngSize}>
                <SelectTrigger className="w-40 border-stone-200">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="512">512 px</SelectItem>
                  <SelectItem value="1024">1024 px</SelectItem>
                  <SelectItem value="2048">2048 px</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-text-secondary">Height auto-adjusts to preserve aspect ratio.</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {variants.map((v) => (
            <Card key={v.key} className="alpine-card border-0 shadow-lg">
              <CardHeader className="border-b border-stone-100">
                <CardTitle className="text-base font-semibold text-text-primary">{v.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Preview svg={v.svg} bgClass={v.bgClass} />

                <div className="flex gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => downloadSVG(v.suggestedName, v.svg)}
                  >
                    <FileText className="w-4 h-4" /> Download SVG
                  </Button>
                  <Button
                    className="mountain-gradient text-white gap-2"
                    onClick={() => downloadPNG(v.suggestedName, v.svg, parseInt(pngSize, 10))}
                  >
                    <Download className="w-4 h-4" /> Download PNG ({pngSize}px)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}