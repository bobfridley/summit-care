// @ts-nocheck
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Copy } from '@/components/icons';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function MySQLSchema() {
  const [copied, setCopied] = useState(false);

  const schemaSQL = useMemo(
    () => `-- SummitCare — MySQL 8.0 schema
-- IMPORTANT:
-- 1) Replace YOUR_DATABASE_NAME with your actual database name (same as MYSQL_DATABASE)
-- 2) Ensure MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE are set in app environment
-- 3) If your server uses a custom CA, set MYSQL_SSL_CA; otherwise the app will fall back to TLS without verification

-- Optional: create database if it doesn't exist
-- CREATE DATABASE IF NOT EXISTS YOUR_DATABASE_NAME DEFAULT CHARACTER SET utf8mb4;
-- USE YOUR_DATABASE_NAME;

-- Drop in dependency order (children first)
DROP TABLE IF EXISTS climb_gear_items;
DROP TABLE IF EXISTS medications;
DROP TABLE IF EXISTS medication_warnings;
DROP TABLE IF EXISTS medication_altitude_effects;
DROP TABLE IF EXISTS medication_database;
DROP TABLE IF EXISTS climbs;

-- Reference catalog: medication database
CREATE TABLE medication_database (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255) NULL,
  category ENUM('cardiovascular','respiratory','neurological','gastrointestinal','endocrine','psychiatric','analgesic','antibiotic','other') NOT NULL,
  risk_level ENUM('low','moderate','high','severe') NOT NULL,
  recommendations TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_meddb_name (name),
  KEY idx_meddb_category (category),
  KEY idx_meddb_risk (risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE medication_altitude_effects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  medication_database_id BIGINT UNSIGNED NOT NULL,
  effect_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mae_med (medication_database_id),
  CONSTRAINT fk_mae_meddb
    FOREIGN KEY (medication_database_id) REFERENCES medication_database(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE medication_warnings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  medication_database_id BIGINT UNSIGNED NOT NULL,
  warning_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mw_med (medication_database_id),
  CONSTRAINT fk_mw_meddb
    FOREIGN KEY (medication_database_id) REFERENCES medication_database(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User-owned medications
CREATE TABLE medications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_by_email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  dosage VARCHAR(255) NOT NULL,
  indication VARCHAR(255) NOT NULL,
  start_date DATE NULL,
  notes TEXT NULL,
  altitude_risk_level ENUM('low','moderate','high','severe') NOT NULL,
  medication_database_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_med_created_by (created_by_email),
  KEY idx_med_start_date (start_date),
  KEY idx_med_risk (altitude_risk_level),
  KEY idx_med_dbid (medication_database_id),
  CONSTRAINT fk_med_refdb
    FOREIGN KEY (medication_database_id) REFERENCES medication_database(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Climbs
CREATE TABLE climbs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_by_email VARCHAR(255) NOT NULL,
  mountain_name VARCHAR(255) NOT NULL,
  elevation INT UNSIGNED NOT NULL,
  location VARCHAR(255) NULL,
  planned_start_date DATE NOT NULL,
  duration_days INT UNSIGNED NULL,
  difficulty_level ENUM('beginner','intermediate','advanced','expert','extreme') NOT NULL DEFAULT 'intermediate',
  climbing_style ENUM('day_hike','overnight','multi_day','expedition','technical_climb') NOT NULL DEFAULT 'day_hike',
  group_size INT UNSIGNED NULL,
  emergency_contact VARCHAR(255) NULL,
  weather_concerns TEXT NULL,
  special_equipment TEXT NULL,
  backpack_name VARCHAR(255) NULL,
  base_pack_weight_kg DECIMAL(6,2) NULL,
  status ENUM('planning','confirmed','in_progress','completed','cancelled') NOT NULL DEFAULT 'planning',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_climbs_user (created_by_email),
  KEY idx_climbs_start (planned_start_date),
  KEY idx_climbs_status (status),
  KEY idx_climbs_elev (elevation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Gear items per climb
CREATE TABLE climb_gear_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  climb_id BIGINT UNSIGNED NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  category ENUM('safety','clothing','technical','camping','navigation','health','food_water','other') NOT NULL DEFAULT 'safety',
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  required TINYINT(1) NOT NULL DEFAULT 1,
  packed TINYINT(1) NOT NULL DEFAULT 0,
  importance ENUM('critical','high','recommended','optional') NOT NULL DEFAULT 'recommended',
  estimated_weight_kg DECIMAL(6,2) NULL,
  notes VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_gear_climb (climb_id),
  KEY idx_gear_cat (category),
  KEY idx_gear_imp (importance),
  CONSTRAINT fk_gear_climb
    FOREIGN KEY (climb_id) REFERENCES climbs(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Done.
-- After creating the schema, grant access to your MYSQL_USER for YOUR_DATABASE_NAME and allow the app's egress IP in your firewall.`,
    []
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(schemaSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleDownload = () => {
    const blob = new Blob([schemaSQL], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'summitcare_mysql_schema.sql';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <div className='max-w-6xl mx-auto p-6'>
      <Card className='mb-4'>
        <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <div>
            <CardTitle>MySQL 8 Schema</CardTitle>
            <CardDescription>
              Copy or download the SQL to initialize your MySQL database.
            </CardDescription>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={handleCopy} className='gap-2'>
              <Copy className='w-4 h-4' />
              {copied ? 'Copied!' : 'Copy SQL'}
            </Button>
            <Button onClick={handleDownload} className='gap-2'>
              <Download className='w-4 h-4' />
              Download .sql
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-sm text-slate-600 mb-3'>
            Tip: run the script in your MySQL client after selecting your target database (USE
            YOUR_DATABASE_NAME;).
          </div>
          <pre className='bg-slate-950 text-slate-100 rounded-lg p-4 overflow-auto text-sm max-h-[70vh]'>
            <code>{schemaSQL}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
