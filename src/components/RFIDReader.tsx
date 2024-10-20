/* eslint-disable @typescript-eslint/no-unused-vars */
// app/components/RFIDReader.tsx
import { useState, useEffect } from "react";
import { RefreshCw, Wifi, WifiOff, Circle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RFIDTag, SerialPortInfo, ReaderStatus } from "@/types/rfid";

export function RFIDReader() {
  const [availablePorts, setAvailablePorts] = useState<SerialPortInfo[]>([]);
  const [readerStatus, setReaderStatus] = useState<ReaderStatus>({
    isConnected: false,
    selectedPort: "",
    position: 1,
    status: "disconnected",
  });
  const [lastScannedTag, setLastScannedTag] = useState<RFIDTag | null>(null);
  const [scanHistory, setScanHistory] = useState<RFIDTag[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPorts();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (readerStatus.isConnected) {
      interval = setInterval(scanTag, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [readerStatus.isConnected]);

  const fetchPorts = async () => {
    try {
      const response = await fetch("/api/rfid/ports");
      const data = await response.json();
      if (data.success) {
        setAvailablePorts(data.data);
      }
    } catch (error) {
      setError("Failed to fetch available ports");
    }
  };

  const handleConnect = async () => {
    try {
      setReaderStatus((prev) => ({ ...prev, status: "connecting" }));

      const response = await fetch("/api/rfid/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          port: readerStatus.selectedPort,
          position: readerStatus.position,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setReaderStatus((prev) => ({
          ...prev,
          isConnected: true,
          status: "connected",
        }));
        setError(null);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setError("Failed to connect to RFID reader");
      setReaderStatus((prev) => ({
        ...prev,
        status: "error",
      }));
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch("/api/rfid/disconnect", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setReaderStatus((prev) => ({
          ...prev,
          isConnected: false,
          status: "disconnected",
        }));
        setLastScannedTag(null);
        setError(null);
      }
    } catch (error) {
      setError("Failed to disconnect RFID reader");
    }
  };

  const scanTag = async () => {
    try {
      const response = await fetch("/api/rfid/scan");
      const data = await response.json();

      if (data.success && data.data) {
        setLastScannedTag(data.data);
        setScanHistory((prev) => [data.data, ...prev].slice(0, 10));
      }
    } catch (error) {
      setError("Failed to scan RFID tag");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              RFID Reader Console
            </h1>
            <p className="text-gray-600">HW-VX6330 UHF RFID Reader Interface</p>
          </div>
          <div className="flex items-center gap-2">
            {readerStatus.isConnected ? (
              <div className="flex items-center gap-2 text-green-600">
                <Wifi size={20} />
                <span>Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <WifiOff size={20} />
                <span>Disconnected</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Connection Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Connection Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Select
                  value={readerStatus.selectedPort}
                  onValueChange={(value) =>
                    setReaderStatus((prev) => ({
                      ...prev,
                      selectedPort: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select COM port" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePorts.map((port) => (
                      <SelectItem key={port.path} value={port.path}>
                        {port.path}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select
                  value={readerStatus.position.toString()}
                  onValueChange={(value) =>
                    setReaderStatus((prev) => ({
                      ...prev,
                      position: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((pos) => (
                      <SelectItem key={pos} value={pos.toString()}>
                        Position {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className={`w-32 ${
                  readerStatus.isConnected
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
                onClick={
                  readerStatus.isConnected ? handleDisconnect : handleConnect
                }
                disabled={
                  readerStatus.status === "connecting" ||
                  (!readerStatus.selectedPort && !readerStatus.isConnected)
                }
              >
                {readerStatus.status === "connecting" ? (
                  <RefreshCw className="animate-spin mr-2" size={16} />
                ) : null}
                {readerStatus.isConnected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Tag Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Reading</CardTitle>
            </CardHeader>
            <CardContent>
              {lastScannedTag ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Circle
                      size={12}
                      className={`fill-current ${
                        lastScannedTag.status === "success"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    />
                    <span className="text-2xl font-mono">
                      {lastScannedTag.uid || "No Tag Detected"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Last updated:{" "}
                    {new Date(lastScannedTag.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Position: {lastScannedTag.position}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 italic">Waiting for tag...</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reader Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Connection Status:</span>
                  <span
                    className={`font-medium ${
                      readerStatus.status === "connected"
                        ? "text-green-600"
                        : readerStatus.status === "error"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {readerStatus.status.charAt(0).toUpperCase() +
                      readerStatus.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Port:</span>
                  <span className="font-medium">
                    {readerStatus.selectedPort || "Not selected"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Position:</span>
                  <span className="font-medium">{readerStatus.position}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scan History */}
        <Card>
          <CardHeader>
            <CardTitle>Scan History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scanHistory.length > 0 ? (
                scanHistory.map((scan, index) => (
                  <div
                    key={`${scan.uid}-${scan.timestamp}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Circle
                        size={8}
                        className={`fill-current ${
                          scan.status === "success"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      />
                      <span className="font-mono">
                        {scan.uid || "No Tag Detected"}
                      </span>
                      <span className="text-sm text-gray-500">
                        (Position {scan.position})
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(scan.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic text-center py-4">
                  No scan history available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
