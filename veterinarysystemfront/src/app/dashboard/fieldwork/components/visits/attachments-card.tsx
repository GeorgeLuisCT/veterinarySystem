"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FieldVisitResponse } from "../../types/visit-response";

export default function AttachmentsCard({ visit, loading }: { visit: FieldVisitResponse | null; loading: boolean; }) {
  return (
    <Card>
      <CardHeader><CardTitle>Adjuntos</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {visit?.attachments?.map((a) => (
            <a key={a.id} className="rounded-md border px-3 py-2 text-sm hover:bg-muted" href={a.fileUrl} target="_blank" rel="noreferrer">{a.fileName}</a>
          ))}
          {!loading && (visit?.attachments?.length ?? 0) === 0 && (
            <div className="text-sm text-muted-foreground">Sin archivos adjuntos.</div>
          )}
          {loading && <div className="text-sm text-muted-foreground">Cargando…</div>}
        </div>
      </CardContent>
    </Card>
  );
}