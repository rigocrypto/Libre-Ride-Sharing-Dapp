import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useState } from "react";

export function LanguageToggle() {
  const [language, setLanguage] = useState<"en" | "es">("en");

  const toggle = () => {
    setLanguage((prev) => (prev === "en" ? "es" : "en"));
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="gap-2"
      data-testid="button-language-toggle"
    >
      <Globe className="w-4 h-4" />
      <span className="uppercase text-xs font-semibold tracking-wide">
        {language}
      </span>
    </Button>
  );
}
