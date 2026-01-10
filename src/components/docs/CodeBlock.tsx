import { useState } from "react";
import { CheckCircle, Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { cn } from "../../lib/utils";

interface CodeBlockProps {
  code: string;
  language: string;
  className?: string;
}

// Map common language names to syntax highlighter language identifiers
const languageMap: Record<string, string> = {
  javascript: "javascript",
  js: "javascript",
  typescript: "typescript",
  ts: "typescript",
  python: "python",
  py: "python",
  json: "json",
  curl: "bash",
  bash: "bash",
  shell: "bash",
  sh: "bash",
  cpp: "cpp",
  c: "c",
  csharp: "csharp",
  java: "java",
  html: "html",
  css: "css",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  markdown: "markdown",
  md: "markdown",
  text: "plaintext",
  plaintext: "plaintext",
};

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Normalize language name
  const normalizedLanguage = languageMap[language.toLowerCase()] || language.toLowerCase();

  return (
    <Card className={cn("relative group overflow-hidden", className)}>
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleCopy}
          className="h-7 w-7 opacity-100 hover:bg-muted"
          title="Copy code"
        >
          {copied ? (
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
      <CardContent className="p-0">
        <SyntaxHighlighter
          language={normalizedLanguage}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "transparent",
            fontSize: "0.75rem",
            lineHeight: "1.5",
          }}
          codeTagProps={{
            style: {
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </CardContent>
    </Card>
  );
}
