import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Copy, Download, Database } from "lucide-react";

export default function MySQLSampleData() {
  const [copied, setCopied] = useState(false);

  const insertSQL = useMemo(() => `-- SummitCare — Sample Data Inserts (MySQL 8.0)
-- IMPORTANT:
-- 1) Replace bobfridley@gmail.com with your actual login email (same one used in the app).
-- 2) Run these after creating the schema on your MySQL server.
-- 3) You can run in a transaction; if you seeded before, consider cleaning first.

USE summitcare;

START TRANSACTION;

-- Seed reference catalog (medication_database)
-- Using INSERT IGNORE so repeated runs don't error if unique names already exist
INSERT IGNORE INTO medication_database (name, generic_name, category, risk_level, recommendations) VALUES
  ('Acetazolamide', 'Diamox', 'other', 'moderate', 'Commonly used for AMS prophylaxis; titrate dose and hydrate well.'),
  ('Ibuprofen', NULL, 'analgesic', 'low', 'Use for pain/inflammation; avoid dehydration.'),
  ('Albuterol', NULL, 'respiratory', 'moderate', 'Carry for bronchospasm; monitor heart rate.'),
  ('Propranolol', NULL, 'cardiovascular', 'high', 'May blunt heart rate response; consult physician before high-altitude use.'),
  ('Nifedipine', NULL, 'cardiovascular', 'high', 'Used in HAPE management; physician guidance required.'),
  ('Zolpidem', NULL, 'psychiatric', 'moderate', 'Sedative effects can mask AMS; use cautiously.');

-- Altitude effects
INSERT INTO medication_altitude_effects (medication_database_id, effect_text)
SELECT id, 'Carbonic anhydrase inhibition promotes acclimatization' FROM medication_database WHERE name = 'Acetazolamide';
INSERT INTO medication_altitude_effects (medication_database_id, effect_text)
SELECT id, 'Paresthesias and diuresis may occur' FROM medication_database WHERE name = 'Acetazolamide';

INSERT INTO medication_altitude_effects (medication_database_id, effect_text)
SELECT id, 'May reduce inflammation-related headache' FROM medication_database WHERE name = 'Ibuprofen';

INSERT INTO medication_altitude_effects (medication_database_id, effect_text)
SELECT id, 'Relieves bronchospasm; possible mild tachycardia' FROM medication_database WHERE name = 'Albuterol';

INSERT INTO medication_altitude_effects (medication_database_id, effect_text)
SELECT id, 'Blunts heart-rate response to exertion' FROM medication_database WHERE name = 'Propranolol';

INSERT INTO medication_altitude_effects (medication_database_id, effect_text)
SELECT id, 'Vasodilation may lower pulmonary pressures (HAPE)' FROM medication_database WHERE name = 'Nifedipine';

INSERT INTO medication_altitude_effects (medication_database_id, effect_text)
SELECT id, 'Sedation can obscure early AMS symptoms' FROM medication_database WHERE name = 'Zolpidem';

-- Mountaineering warnings
INSERT INTO medication_warnings (medication_database_id, warning_text)
SELECT id, 'Increase fluid intake; monitor for excessive diuresis' FROM medication_database WHERE name = 'Acetazolamide';

INSERT INTO medication_warnings (medication_database_id, warning_text)
SELECT id, 'Use within dose limits; high doses increase GI/renal risk' FROM medication_database WHERE name = 'Ibuprofen';

INSERT INTO medication_warnings (medication_database_id, warning_text)
SELECT id, 'Monitor HR; avoid overuse without medical instruction' FROM medication_database WHERE name = 'Albuterol';

INSERT INTO medication_warnings (medication_database_id, warning_text)
SELECT id, 'May impair exercise tolerance at altitude' FROM medication_database WHERE name = 'Propranolol';

INSERT INTO medication_warnings (medication_database_id, warning_text)
SELECT id, 'Requires medical supervision for HAPE treatment' FROM medication_database WHERE name = 'Nifedipine';

INSERT INTO medication_warnings (medication_database_id, warning_text)
SELECT id, 'Avoid if concerned about masking AMS symptoms' FROM medication_database WHERE name = 'Zolpidem';

-- User-owned user_medications (replace bobfridley@gmail.com)
INSERT INTO user_medications (
  created_by_email, name, dosage, indication, start_date, notes, altitude_risk_level, medication_database_id
) VALUES
  ('bobfridley@gmail.com', 'Acetazolamide', '125mg twice daily', 'AMS prophylaxis', '2025-06-01', 'Demo seed', 'moderate',
    (SELECT id FROM medication_database WHERE name = 'Acetazolamide')),
  ('bobfridley@gmail.com', 'Ibuprofen', '400mg as needed', 'Pain relief', '2025-05-15', 'Demo seed', 'low',
    (SELECT id FROM medication_database WHERE name = 'Ibuprofen')),
  ('bobfridley@gmail.com', 'Albuterol', '2 puffs as needed', 'Bronchospasm', '2025-05-10', 'Demo seed', 'moderate',
    (SELECT id FROM medication_database WHERE name = 'Albuterol'));

-- Sample user_climbs (replace bobfridley@gmail.com)
INSERT INTO user_climbs (
  created_by_email, mountain_name, elevation, location, planned_start_date, duration_days,
  difficulty_level, climbing_style, group_size, emergency_contact, weather_concerns, special_equipment,
  backpack_name, base_pack_weight_kg, status, notes
) VALUES
  ('bobfridley@gmail.com', 'Mount Whitney', 14505, 'Sierra Nevada, California', '2025-07-15', 2,
   'advanced', 'overnight', 3, 'John Doe 555-1234', 'Afternoon storms possible', 'Microspikes early season',
   'Osprey Exos 48', 1.40, 'planning', 'Demo climb seed'),
  ('bobfridley@gmail.com', 'Pikes Peak', 14115, 'Front Range, Colorado', '2025-08-12', 1,
   'intermediate', 'day_hike', 2, 'Jane Roe 555-5678', 'Windy on summit ridge', 'Trekking poles recommended',
   'Osprey Talon 22', 0.90, 'planning', 'Demo climb seed');

-- Gear for Mount Whitney
INSERT INTO climb_gear_items (climb_id, item_name, category, quantity, required, packed, importance, estimated_weight_kg, notes)
SELECT id, 'First Aid Kit', 'health', 1, 1, 0, 'critical', 0.25, '' FROM user_climbs WHERE mountain_name = 'Mount Whitney' AND created_by_email = 'bobfridley@gmail.com';
INSERT INTO climb_gear_items (climb_id, item_name, category, quantity, required, packed, importance, estimated_weight_kg, notes)
SELECT id, 'Water (3L)', 'food_water', 1, 1, 0, 'critical', 3.00, 'Hydration system or bottles' FROM user_climbs WHERE mountain_name = 'Mount Whitney' AND created_by_email = 'bobfridley@gmail.com';
INSERT INTO climb_gear_items (climb_id, item_name, category, quantity, required, packed, importance, estimated_weight_kg, notes)
SELECT id, 'Headlamp', 'technical', 1, 1, 0, 'high', 0.10, 'With spare batteries' FROM user_climbs WHERE mountain_name = 'Mount Whitney' AND created_by_email = 'bobfridley@gmail.com';
INSERT INTO climb_gear_items (climb_id, item_name, category, quantity, required, packed, importance, estimated_weight_kg, notes)
SELECT id, 'Insulating Layer', 'clothing', 1, 1, 0, 'high', 0.40, 'Fleece or puffy' FROM user_climbs WHERE mountain_name = 'Mount Whitney' AND created_by_email = 'bobfridley@gmail.com';
INSERT INTO climb_gear_items (climb_id, item_name, category, quantity, required, packed, importance, estimated_weight_kg, notes)
SELECT id, 'Microspikes', 'technical', 1, 0, 0, 'recommended', 0.40, '' FROM user_climbs WHERE mountain_name = 'Mount Whitney' AND created_by_email = 'bobfridley@gmail.com';

-- Gear for Pikes Peak
INSERT INTO climb_gear_items (climb_id, item_name, category, quantity, required, packed, importance, estimated_weight_kg, notes)
SELECT id, 'Map & Compass or GPS', 'navigation', 1, 1, 0, 'critical', 0.15, '' FROM user_climbs WHERE mountain_name = 'Pikes Peak' AND created_by_email = 'bobfridley@gmail.com';
INSERT INTO climb_gear_items (climb_id, item_name, category, quantity, required, packed, importance, estimated_weight_kg, notes)
SELECT id, 'Shell (Jacket)', 'clothing', 1, 1, 0, 'high', 0.35, 'Water/wind resistant' FROM user_climbs WHERE mountain_name = 'Pikes Peak' AND created_by_email = 'bobfridley@gmail.com';
INSERT INTO climb_gear_items (climb_id, item_name, category, quantity, required, packed, importance, estimated_weight_kg, notes)
SELECT id, 'Trekking Poles', 'technical', 1, 0, 0, 'optional', 0.60, '' FROM user_climbs WHERE mountain_name = 'Pikes Peak' AND created_by_email = 'bobfridley@gmail.com';

COMMIT;

-- Done. Replace bobfridley@gmail.com before running.
`, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(insertSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleDownload = () => {
    const blob = new Blob([insertSQL], { type: "text/sql;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summitcare_sample_data.sql";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-4">
        <Database className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">MySQL Sample Data</h1>
      </div>
      <Card className="mb-4">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>Insert Scripts</CardTitle>
            <CardDescription>Copy or download SQL to seed demo data into your MySQL database.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopy} className="gap-2">
              <Copy className="w-4 h-4" />
              {copied ? "Copied!" : "Copy SQL"}
            </Button>
            <Button onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" />
              Download .sql
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-600 mb-3">
            <strong>Important:</strong> Replace <code className="bg-slate-100 px-1 py-0.5 rounded">bobfridley@gmail.com</code> with your actual app login email before running this script.
          </div>
          <pre className="bg-slate-950 text-slate-100 rounded-lg p-4 overflow-auto text-sm max-h-[70vh]">
            <code>{insertSQL}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}