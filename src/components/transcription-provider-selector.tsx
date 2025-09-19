"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAvailableProviders, getProviderSettings } from "@/lib/transcription-config";

interface TranscriptionProviderSelectorProps {
  selectedProvider?: string;
  onProviderChange?: (provider: string) => void;
  disabled?: boolean;
}

export function TranscriptionProviderSelector({
  selectedProvider,
  onProviderChange,
  disabled = false,
}: TranscriptionProviderSelectorProps) {
  const [availableProviders] = useState(() => getAvailableProviders());
  const [config, setConfig] = useState(() => {
    const providers = availableProviders.map(provider => ({
      name: provider,
      settings: getProviderSettings(provider),
    }));
    return providers;
  });

  const getProviderDisplayName = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "groq":
        return "Groq (Whisper Turbo)";
      case "huggingface":
      case "hf":
        return "HuggingFace (Whisper Large-v3)";
      case "openai":
        return "OpenAI (Whisper)";
      case "assemblyai":
        return "AssemblyAI";
      default:
        return provider;
    }
  };

  const getProviderDescription = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "groq":
        return "快速转录，适合实时处理";
      case "huggingface":
        return "免费使用，高质量转录";
      case "openai":
        return "官方API，质量最好";
      case "assemblyai":
        return "专业级转录服务";
      default:
        return "";
    }
  };

  const getProviderStatus = (provider: string) => {
    const settings = getProviderSettings(provider);
    if (settings.apiKey) {
      return { type: "configured", text: "已配置" };
    } else if (provider.toLowerCase() === "huggingface") {
      return { type: "available", text: "免费可用" };
    } else {
      return { type: "missing-api-key", text: "需要API密钥" };
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>转录服务提供商</CardTitle>
        <CardDescription>
          选择用于音频转录的AI服务提供商
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">当前提供商</label>
          <Select
            value={selectedProvider}
            onValueChange={onProviderChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择转录提供商" />
            </SelectTrigger>
            <SelectContent>
              {availableProviders.map((provider) => {
                const status = getProviderStatus(provider);
                return (
                  <SelectItem key={provider} value={provider}>
                    <div className="flex items-center justify-between w-full">
                      <span>{getProviderDisplayName(provider)}</span>
                      <Badge
                        variant={
                          status.type === "configured"
                            ? "default"
                            : status.type === "available"
                            ? "secondary"
                            : "destructive"
                        }
                        className="ml-2"
                      >
                        {status.text}
                      </Badge>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">提供商详情</h4>
          {availableProviders.map((provider) => {
            const status = getProviderStatus(provider);
            const isSelected = selectedProvider === provider;

            return (
              <div
                key={provider}
                className={`p-3 rounded-lg border ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">
                    {getProviderDisplayName(provider)}
                  </h5>
                  <Badge
                    variant={
                      status.type === "configured"
                        ? "default"
                        : status.type === "available"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {status.text}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {getProviderDescription(provider)}
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>模型: {getProviderSettings(provider).model}</div>
                  <div>
                    最大文件: {Math.round((getProviderSettings(provider).maxFileSize || 0) / 1024 / 1024)}MB
                  </div>
                  <div>
                    最大时长: {getProviderSettings(provider).maxDuration}秒
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground">
          💡 提示：系统会自动按优先级尝试可用的提供商，无需担心单个提供商的限制
        </div>
      </CardContent>
    </Card>
  );
}
