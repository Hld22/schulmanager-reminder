import express from "express";
import cors from "cors";
import { SchulmanagerClient } from "schulmanager-client";

const app = express();

app.use(cors());
app.use(express.json());

type NormalizedItem = {
  id: string;
  type: "homework" | "exam";
  title: string;
  subject?: string;
  date: string;
  time?: string;
  details?: string;
  sourceId?: string;
};

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

function getDate(value: unknown): string | undefined {
  const s = asString(value);
  if (!s) return undefined;
  return s.slice(0, 10);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/sync", async (req, res) => {
  const { emailOrUsername, password } = req.body ?? {};

  if (
    typeof emailOrUsername !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      error: "emailOrUsername und password sind erforderlich."
    });
  }

  try {
    const client = await SchulmanagerClient.login({
      emailOrUsername,
      password
    });

    const user = client.user as any;

    const student = (
      user?.associatedParents?.[0]?.student ??
      user?.student
    ) as { id?: string } | undefined;

    if (!student?.id) {
      return res.status(400).json({
        error:
          "Für diesen Account konnte kein zugehöriger Schüler gefunden werden."
      });
    }

    const homework = (await client.classbook.getHomework({
      id: student.id
    })) as any[];

    const examResult = (await client.exams.getExamsWithVisibility({
      studentId: student.id,
      start: new Date().toISOString().slice(0, 10),
      end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 120)
        .toISOString()
        .slice(0, 10)
    })) as any;

    const items: NormalizedItem[] = [];

    for (const hw of homework) {
      const date =
        getDate(hw.date) ??
        getDate(hw.dueDate) ??
        getDate(hw.lessonDate);

      if (!date) continue;

      const title =
        asString(hw.homework) ??
        asString(hw.text) ??
        asString(hw.description) ??
        "Hausaufgabe";

      const subject =
        asString(hw.subject?.name) ??
        asString(hw.subject?.label) ??
        asString(hw.subjectName);

      const sourceId = String(
        hw.id ?? `${date}-${subject}-${title}`
      );

      items.push({
        id: `homework-${sourceId}`,
        sourceId,
        type: "homework",
        title,
        subject,
        date,
        time: asString(hw.time),
        details: asString(hw.description)
      });
    }

    for (const exam of (examResult?.exams ?? []) as any[]) {
      const date =
        getDate(exam.date) ??
        getDate(exam.startDate);

      if (!date) continue;

      const subject =
        asString(exam.subject?.name) ??
        asString(exam.subject?.label) ??
        asString(exam.subjectName);

      const title =
        asString(exam.title) ??
        asString(exam.name) ??
        asString(exam.description) ??
        "Klassenarbeit";

      const sourceId = String(
        exam.id ?? `${date}-${subject}-${title}`
      );

      items.push({
        id: `exam-${sourceId}`,
        sourceId,
        type: "exam",
        title,
        subject,
        date,
        time:
          asString(exam.time) ??
          asString(exam.startTime),
        details: asString(exam.description)
      });
    }

    items.sort((a, b) =>
      `${a.date}-${a.time ?? ""}`.localeCompare(
        `${b.date}-${b.time ?? ""}`
      )
    );

    res.json({
      items,
      syncedAt: new Date().toISOString()
    });
  } catch (error: any) {
    const message =
      error?.germanMessage ??
      error?.message ??
      "Schulmanager-Synchronisation fehlgeschlagen.";

    console.error("Schulmanager sync error:", message);

    res.status(502).json({
      error: message
    });
  }
});

const port = Number(process.env.PORT ?? 8787);

app.listen(port, () => {
  console.log(
    `Schulmanager Reminder API läuft auf Port ${port}`
  );
});
