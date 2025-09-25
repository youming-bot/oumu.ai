/**
 * 系统监控组件
 * 提供实时性能监控、错误统计和系统健康状态检查
 */

"use client";

import {
  Clock,
  Cpu,
  Download,
  MemoryStick,
  RefreshCw,
  Upload,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clearLocalErrorLogs, getErrorStats } from "@/lib/error-handler";
import type { ErrorStats } from "@/types/errors";

// 系统监控数据接口
interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    online: boolean;
    downlink: number;
    uplink: number;
    latency: number;
  };
  performance: {
    loadTime: number;
    firstPaint: number;
    domInteractive: number;
  };
}

// 应用性能数据接口
interface AppMetrics {
  activeRequests: number;
  totalRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  cacheHits: number;
  cacheMisses: number;
  memoryUsage: number;
}

// 监控配置接口
interface MonitorConfig {
  enabled: boolean;
  interval: number;
  maxHistory: number;
  trackNetwork: boolean;
  trackPerformance: boolean;
  trackErrors: boolean;
}

// 系统监控组件
export function SystemMonitor({
  config = { enabled: true, interval: 5000, maxHistory: 100 },
}: {
  config?: Partial<MonitorConfig>;
}) {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [_appMetrics, _setAppMetrics] = useState<AppMetrics>({
    activeRequests: 0,
    totalRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    memoryUsage: 0,
  });
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [monitorConfig, _setMonitorConfig] = useState<MonitorConfig>({
    enabled: true,
    interval: 5000,
    maxHistory: 100,
    trackNetwork: true,
    trackPerformance: true,
    trackErrors: true,
    ...config,
  });

  // 获取网络连接信息
  const getNetworkInfo = async () => {
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      return {
        downlink: connection.downlink || 0,
        uplink: connection.uplink || 0,
        latency: connection.rtt || 0,
      };
    }
    return { downlink: 0, uplink: 0, latency: 0 };
  };

  // 获取性能指标
  const getPerformanceMetrics = () => {
    if ("performance" in window) {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        firstPaint: 0, // 需要使用 PerformanceObserver
        domInteractive: navigation.domInteractive - navigation.fetchStart,
      };
    }
    return { loadTime: 0, firstPaint: 0, domInteractive: 0 };
  };

  // 获取内存信息
  const getMemoryInfo = () => {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
      };
    }
    return { used: 0, total: 0, percentage: 0 };
  };

  // 收集系统指标
  const collectSystemMetrics = async () => {
    try {
      const networkInfo = await getNetworkInfo();
      const performanceMetrics = getPerformanceMetrics();
      const memoryInfo = getMemoryInfo();

      const metrics: SystemMetrics = {
        timestamp: Date.now(),
        cpu: {
          usage: 0, // 浏览器中无法直接获取CPU使用率
          cores: navigator.hardwareConcurrency || 0,
        },
        memory: memoryInfo,
        storage: {
          used: 0,
          total: 0,
          percentage: 0,
        },
        network: {
          online: navigator.onLine,
          ...networkInfo,
        },
        performance: performanceMetrics,
      };

      setSystemMetrics(metrics);
    } catch (_error) {}
  };

  // 收集错误统计
  const collectErrorStats = () => {
    if (monitorConfig.trackErrors) {
      const stats = getErrorStats();
      setErrorStats(stats);
    }
  };

  // 初始化监控
  useEffect(() => {
    if (!monitorConfig.enabled) return;

    // 初始收集
    collectSystemMetrics();
    collectErrorStats();

    // 设置定时收集
    const interval = setInterval(() => {
      collectSystemMetrics();
      collectErrorStats();
    }, monitorConfig.interval);

    // 网络状态监听
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [
    monitorConfig,
    collectErrorStats, // 初始收集
    collectSystemMetrics,
  ]);

  // 格式化字节大小
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
  };

  // 格式化时间
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  // 获取健康状态
  const getHealthStatus = () => {
    if (!isOnline) return { status: "critical", label: "离线", color: "bg-red-500" };
    if (errorStats && errorStats.errorFrequency > 10)
      return { status: "warning", label: "警告", color: "bg-yellow-500" };
    if (systemMetrics && systemMetrics.memory.percentage > 90)
      return { status: "warning", label: "内存高", color: "bg-yellow-500" };
    return { status: "healthy", label: "正常", color: "bg-green-500" };
  };

  const healthStatus = getHealthStatus();

  if (!monitorConfig.enabled) {
    return null;
  }

  return (
    <div className="space-y-4 p-4">
      {/* 顶部状态卡片 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">系统监控</CardTitle>
            <CardDescription>实时系统状态和性能指标</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${healthStatus.color} text-white`}>{healthStatus.label}</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                collectSystemMetrics();
                collectErrorStats();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="performance">性能</TabsTrigger>
          <TabsTrigger value="network">网络</TabsTrigger>
          <TabsTrigger value="errors">错误</TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 网络状态 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">网络状态</CardTitle>
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{isOnline ? "在线" : "离线"}</div>
                {systemMetrics && (
                  <p className="mt-1 text-muted-foreground text-xs">
                    延迟: {systemMetrics.network.latency}ms
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 内存使用 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">内存使用</CardTitle>
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {systemMetrics ? `${Math.round(systemMetrics.memory.percentage)}%` : "N/A"}
                </div>
                {systemMetrics && (
                  <div className="mt-2">
                    <Progress value={systemMetrics.memory.percentage} className="h-2" />
                    <p className="mt-1 text-muted-foreground text-xs">
                      {formatBytes(systemMetrics.memory.used)} /{" "}
                      {formatBytes(systemMetrics.memory.total)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CPU核心 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">CPU核心</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {systemMetrics ? systemMetrics.cpu.cores : "N/A"}
                </div>
                <p className="mt-1 text-muted-foreground text-xs">核心数量</p>
              </CardContent>
            </Card>

            {/* 页面加载时间 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">页面加载</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {systemMetrics ? formatTime(systemMetrics.performance.loadTime) : "N/A"}
                </div>
                <p className="mt-1 text-muted-foreground text-xs">总加载时间</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 性能标签页 */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">性能指标</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemMetrics ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>页面加载时间</span>
                        <span className="font-medium">
                          {formatTime(systemMetrics.performance.loadTime)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>DOM交互时间</span>
                        <span className="font-medium">
                          {formatTime(systemMetrics.performance.domInteractive)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>内存使用率</span>
                        <span className="font-medium">
                          {Math.round(systemMetrics.memory.percentage)}%
                        </span>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="font-medium text-sm">内存使用分布</div>
                      <Progress value={systemMetrics.memory.percentage} className="h-3" />
                      <div className="flex justify-between text-muted-foreground text-xs">
                        <span>{formatBytes(systemMetrics.memory.used)}</span>
                        <span>{formatBytes(systemMetrics.memory.total)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">暂无性能数据</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">浏览器信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>用户代理:</span>
                    <span className="max-w-[200px] truncate text-right text-muted-foreground text-xs">
                      {navigator.userAgent.substring(0, 50)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>语言:</span>
                    <span>{navigator.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>平台:</span>
                    <span>{navigator.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span> Cookie 启用:</span>
                    <span>{navigator.cookieEnabled ? "是" : "否"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 网络标签页 */}
        <TabsContent value="network" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">网络状态</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemMetrics ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        {isOnline ? (
                          <Wifi className="h-4 w-4 text-green-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-500" />
                        )}
                        连接状态
                      </span>
                      <Badge variant={isOnline ? "default" : "destructive"}>
                        {isOnline ? "在线" : "离线"}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        下载速度
                      </span>
                      <span className="font-medium">{systemMetrics.network.downlink} Mbps</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        上传速度
                      </span>
                      <span className="font-medium">{systemMetrics.network.uplink} Mbps</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        延迟
                      </span>
                      <span className="font-medium">{systemMetrics.network.latency} ms</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">暂无网络数据</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">连接详情</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {systemMetrics && "connection" in navigator ? (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>连接类型:</span>
                      <span>{(navigator as any).connection?.effectiveType || "未知"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>省电模式:</span>
                      <span>{(navigator as any).connection?.saveData ? "开启" : "关闭"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>最大下行速度:</span>
                      <span>{(navigator as any).connection?.downlinkMax || "未知"} Mbps</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    浏览器不支持网络信息API
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 错误标签页 */}
        <TabsContent value="errors" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  错误统计
                  <Button variant="outline" size="sm" onClick={clearLocalErrorLogs}>
                    清除日志
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {errorStats ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>总错误数:</span>
                        <span className="font-medium">{errorStats.totalErrors}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>错误频率:</span>
                        <span className="font-medium">{errorStats.errorFrequency} 次/小时</span>
                      </div>
                      {errorStats.lastErrorTime && (
                        <div className="flex justify-between text-sm">
                          <span>最后错误时间:</span>
                          <span className="font-medium">
                            {new Date(errorStats.lastErrorTime).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <Separator />
                    {Object.keys(errorStats.errorsByCode).length > 0 ? (
                      <div className="space-y-2">
                        <div className="font-medium text-sm">错误代码分布</div>
                        {Object.entries(errorStats.errorsByCode)
                          .sort(([, a], [, b]) => Number(b) - Number(a))
                          .slice(0, 5)
                          .map(([code, count]) => (
                            <div key={code} className="flex justify-between text-sm">
                              <Badge variant="outline" className="text-xs">
                                {code}
                              </Badge>
                              <span>{String(count)} 次</span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-muted-foreground">暂无错误数据</div>
                    )}
                  </>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">暂无错误统计</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">组件错误分布</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {errorStats && Object.keys(errorStats.errorsByComponent).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(errorStats.errorsByComponent)
                      .sort(([, a], [, b]) => Number(b) - Number(a))
                      .slice(0, 10)
                      .map(([component, count]) => (
                        <div key={component} className="flex justify-between text-sm">
                          <span className="max-w-[150px] truncate">{component}</span>
                          <span className="font-medium">{String(count)} 次</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">暂无组件错误数据</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 监控Hook
export function useSystemMonitor(_config?: Partial<MonitorConfig>) {
  const [systemMetrics, _setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const updateMetrics = () => {
    // 这里可以添加获取系统指标的逻辑
    const stats = getErrorStats();
    setErrorStats(stats);
  };

  return {
    systemMetrics,
    errorStats,
    isOnline,
    updateMetrics,
    clearErrorLogs: clearLocalErrorLogs,
  };
}
