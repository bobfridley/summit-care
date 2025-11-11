import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Copy, Download } from "lucide-react";

export default function MySQLSchema() {
  const [copied, setCopied] = useState(false);

  const schemaSQL = useMemo(() => `-- phpMyAdmin SQL Dump
-- version 5.2.2deb1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 11, 2025 at 04:59 PM
-- Server version: 11.8.3-MariaDB-0+deb13u1 from Debian
-- PHP Version: 8.4.11

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: \`summitcare\`
--
CREATE DATABASE  IF NOT EXISTS summitcare DEFAULT CHARACTER SET utf8mb4;
USE summitcare;
-- --------------------------------------------------------

-- Drop in dependency order (children first)
DROP TABLE IF EXISTS \`climb_gear_items\`;
DROP TABLE IF EXISTS \`climb_medications\`;
DROP TABLE IF EXISTS \`user_climb_status_history\`;
DROP TABLE IF EXISTS \`user_medications\`;
DROP TABLE IF EXISTS \`medication_altitude_effects\`;
DROP TABLE IF EXISTS \`medication_warnings\`;
DROP TABLE IF EXISTS \`user_trip_reports\`;
DROP TABLE IF EXISTS \`contraindications\`;
DROP TABLE IF EXISTS \`ae_trends_cache\`;
DROP TABLE IF EXISTS \`user_climbs\`;
DROP TABLE IF EXISTS \`medication_database\`;
DROP TABLE IF EXISTS \`gear_preset_items\`;
DROP TABLE IF EXISTS \`gear_catalog\`;
DROP TABLE IF EXISTS \`gear_presets\`;

--
-- Table structure for table \`user_climbs\`
--

CREATE TABLE \`user_climbs\` (
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
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`climb_gear_items\`
--

CREATE TABLE \`climb_gear_items\` (
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
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`climb_medications\`
--

CREATE TABLE \`climb_medications\` (
  \`id\` bigint(20) UNSIGNED NOT NULL,
  \`climb_id\` bigint(20) UNSIGNED NOT NULL,
  \`medication_id\` bigint(20) UNSIGNED NOT NULL,
  \`usage_notes\` varchar(500) DEFAULT NULL,
  \`start_offset_days\` int(11) DEFAULT NULL,
  \`end_offset_days\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`user_climb_status_history\`
--

CREATE TABLE \`user_climb_status_history\` (
  \`id\` bigint(20) UNSIGNED NOT NULL,
  \`climb_id\` bigint(20) UNSIGNED NOT NULL,
  \`old_status\` enum('planning','confirmed','in_progress','completed','cancelled') DEFAULT NULL,
  \`new_status\` enum('planning','confirmed','in_progress','completed','cancelled') NOT NULL,
  \`changed_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`changed_by_email\` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`gear_catalog\`
--

CREATE TABLE \`gear_catalog\` (
  \`id\` bigint(20) UNSIGNED NOT NULL,
  \`item_name\` varchar(255) NOT NULL,
  \`category\` enum('safety','clothing','technical','camping','navigation','health','food_water','other') NOT NULL,
  \`default_importance\` enum('critical','high','recommended','optional') NOT NULL DEFAULT 'recommended',
  \`default_weight_kg\` decimal(6,2) DEFAULT NULL,
  \`notes\` varchar(500) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`gear_presets\`
--

CREATE TABLE \`gear_presets\` (
  \`id\` bigint(20) UNSIGNED NOT NULL,
  \`name\` varchar(120) NOT NULL,
  \`description\` varchar(500) DEFAULT NULL,
  \`scope\` enum('general','style','elevation','season') NOT NULL DEFAULT 'general',
  \`style\` enum('day_hike','overnight','multi_day','expedition','technical_climb') DEFAULT NULL,
  \`min_elevation\` int(10) UNSIGNED DEFAULT NULL,
  \`max_elevation\` int(10) UNSIGNED DEFAULT NULL,
  \`min_duration_days\` int(10) UNSIGNED DEFAULT NULL,
  \`season\` enum('any','winter','summer','shoulder') NOT NULL DEFAULT 'any',
  \`active\` tinyint(1) NOT NULL DEFAULT 1,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`gear_preset_items\`
--

CREATE TABLE \`gear_preset_items\` (
  \`id\` bigint(20) UNSIGNED NOT NULL,
  \`gear_preset_id\` bigint(20) UNSIGNED NOT NULL,
  \`gear_catalog_id\` bigint(20) UNSIGNED DEFAULT NULL,
  \`item_name\` varchar(255) NOT NULL,
  \`category\` enum('safety','clothing','technical','camping','navigation','health','food_water','other') NOT NULL,
  \`quantity\` int(10) UNSIGNED NOT NULL DEFAULT 1,
  \`importance\` enum('critical','high','recommended','optional') NOT NULL DEFAULT 'recommended',
  \`estimated_weight_kg\` decimal(6,2) DEFAULT NULL,
  \`notes\` varchar(500) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`medications\`
--

CREATE TABLE \`user_medications\` (
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
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`medication_altitude_effects\`
--

CREATE TABLE \`medication_altitude_effects\` (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  medication_database_id BIGINT UNSIGNED NOT NULL,
  effect_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`medication_database\`
--

CREATE TABLE \`medication_database\` (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255) NULL,
  category ENUM('cardiovascular','respiratory','neurological','gastrointestinal','endocrine','psychiatric','analgesic','antibiotic','other') NOT NULL,
  risk_level ENUM('low','moderate','high','severe') NOT NULL,
  recommendations TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`medication_warnings\`
--

CREATE TABLE \`medication_warnings\` (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  medication_database_id BIGINT UNSIGNED NOT NULL,
  warning_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`user_trip_reports\`
--

CREATE TABLE \`user_trip_reports\` (
  \`id\` bigint(20) UNSIGNED NOT NULL,
  \`created_by_email\` varchar(255) NOT NULL,
  \`climb_id\` bigint(20) UNSIGNED DEFAULT NULL,
  \`name\` varchar(255) NOT NULL,
  \`report_json\` longtext NOT NULL,
  \`generated_at\` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`contraindications\`
--

CREATE TABLE contraindications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  drug VARCHAR(128) NOT NULL,
  contraindication VARCHAR(255) NOT NULL,
  level VARCHAR(24) NOT NULL DEFAULT 'major',
  note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table \`ae_trends_cache\`
--

CREATE TABLE ae_trends_cache (
  drug VARCHAR(128) NOT NULL,
  bucket_date  DATE NOT NULL,
  count_value  INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table \`user_climbs\`
--
ALTER TABLE \`user_climbs\`
  ADD KEY \`idx_climbs_user\` (\`created_by_email\`),
  ADD KEY \`idx_climbs_start\` (\`planned_start_date\`),
  ADD KEY \`idx_climbs_status\` (\`status\`),
  ADD KEY \`idx_climbs_elev\` (\`elevation\`);

--
-- Indexes for table \`climb_gear_items\`
--
ALTER TABLE \`climb_gear_items\`
  ADD KEY \`idx_gear_climb\` (\`climb_id\`),
  ADD KEY \`idx_gear_cat\` (\`category\`),
  ADD KEY \`idx_gear_imp\` (\`importance\`);

--
-- Indexes for table \`climb_medications\`
--
ALTER TABLE \`climb_medications\`
  ADD PRIMARY KEY (\`id\`),
  ADD UNIQUE KEY \`uq_climb_med\` (\`climb_id\`,\`medication_id\`),
  ADD KEY \`fk_cm_med\` (\`medication_id\`);

--
-- Indexes for table \`user_climb_status_history\`
--
ALTER TABLE \`user_climb_status_history\`
  ADD PRIMARY KEY (\`id\`),
  ADD KEY \`idx_csh_climb\` (\`climb_id\`),
  ADD KEY \`idx_csh_time\` (\`changed_at\`);

--
-- Indexes for table \`gear_catalog\`
--
ALTER TABLE \`gear_catalog\`
  ADD PRIMARY KEY (\`id\`),
  ADD UNIQUE KEY \`uq_gear_item\` (\`item_name\`),
  ADD KEY \`idx_gear_cat\` (\`category\`);
ALTER TABLE \`gear_catalog\` ADD FULLTEXT KEY \`ft_gear\` (\`item_name\`,\`notes\`);

--
-- Indexes for table \`gear_presets\`
--
ALTER TABLE \`gear_presets\`
  ADD PRIMARY KEY (\`id\`),
  ADD UNIQUE KEY \`uq_preset_name\` (\`name\`);

--
-- Indexes for table \`gear_preset_items\`
--
ALTER TABLE \`gear_preset_items\`
  ADD PRIMARY KEY (\`id\`),
  ADD KEY \`idx_gpi_preset\` (\`gear_preset_id\`),
  ADD KEY \`idx_gpi_cat\` (\`category\`),
  ADD KEY \`fk_gpi_catalog\` (\`gear_catalog_id\`);

--
-- Indexes for table \`medications\`
--
ALTER TABLE \`user_medications\`
  ADD KEY \`idx_med_created_by\` (\`created_by_email\`),
  ADD KEY \`idx_med_start_date\` (\`start_date\`),
  ADD KEY \`idx_med_risk\` (\`altitude_risk_level\`),
  ADD KEY \`idx_med_dbid\` (\`medication_database_id\`);

--
-- Indexes for table \`medication_altitude_effects\`
--
ALTER TABLE \`medication_altitude_effects\`
  ADD KEY \`idx_mae_med\` (\`medication_database_id\`);

--
-- Indexes for table \`medication_database\`
--
ALTER TABLE \`medication_database\`
  ADD UNIQUE KEY \`uq_meddb_name\` (\`name\`),
  ADD KEY \`idx_meddb_category\` (\`category\`),
  ADD KEY \`idx_meddb_risk\` (\`risk_level\`);

--
-- Indexes for table \`medication_warnings\`
--
ALTER TABLE \`medication_warnings\`
  ADD KEY \`idx_mw_med\` (\`medication_database_id\`);

--
-- Indexes for table \`user_trip_reports\`
--
ALTER TABLE \`user_trip_reports\`
  ADD PRIMARY KEY (\`id\`),
  ADD KEY \`idx_tr_user\` (\`created_by_email\`),
  ADD KEY \`idx_tr_climb\` (\`climb_id\`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table \`user_climbs\`
--
ALTER TABLE \`user_climbs\`
  MODIFY \`id\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table \`climb_gear_items\`
--
ALTER TABLE \`climb_gear_items\`
  MODIFY \`id\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table \`climb_medications\`
--
ALTER TABLE \`climb_medications\`
  MODIFY \`id\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table \`user_climb_status_history\`
--
ALTER TABLE \`user_climb_status_history\`
  MODIFY \`id\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table \`gear_catalog\`
--
ALTER TABLE \`gear_catalog\`
  MODIFY \`id\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table \`gear_presets\`
--
ALTER TABLE \`gear_presets\`
  MODIFY \`id\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table \`gear_preset_items\`
--
ALTER TABLE \`gear_preset_items\`
  MODIFY \`id\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table \`medications\`
--
ALTER TABLE \`user_medications\`
  MODIFY \`id\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table \`medication_altitude_effects\`
--
ALTER TABLE \`medication_altitude_effects\`
  MODIFY \`id\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table \`medication_database\`
--
ALTER TABLE \`medication_database\`
  MODIFY \`id\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table \`medication_warnings\`
--
ALTER TABLE \`medication_warnings\`
  MODIFY \`id\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table \`user_trip_reports\`
--
ALTER TABLE \`user_trip_reports\`
  MODIFY \`id\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table \`climb_gear_items\`
--
ALTER TABLE \`climb_gear_items\`
  ADD CONSTRAINT \`fk_gear_climb\` FOREIGN KEY (\`climb_id\`) REFERENCES \`user_climbs\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table \`climb_medications\`
--
ALTER TABLE \`climb_medications\`
  ADD CONSTRAINT \`fk_cm_climb\` FOREIGN KEY (\`climb_id\`) REFERENCES \`user_climbs\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT \`fk_cm_med\` FOREIGN KEY (\`medication_id\`) REFERENCES \`user_medications\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table \`user_climb_status_history\`
--
ALTER TABLE \`user_climb_status_history\`
  ADD CONSTRAINT \`fk_csh_climb\` FOREIGN KEY (\`climb_id\`) REFERENCES \`user_climbs\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table \`gear_preset_items\`
--
ALTER TABLE \`gear_preset_items\`
  ADD CONSTRAINT \`fk_gpi_catalog\` FOREIGN KEY (\`gear_catalog_id\`) REFERENCES \`gear_catalog\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT \`fk_gpi_preset\` FOREIGN KEY (\`gear_preset_id\`) REFERENCES \`gear_presets\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table \`medications\`
--
ALTER TABLE \`user_medications\`
  ADD CONSTRAINT \`fk_med_refdb\` FOREIGN KEY (\`medication_database_id\`) REFERENCES \`medication_database\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table \`medication_altitude_effects\`
--
ALTER TABLE \`medication_altitude_effects\`
  ADD CONSTRAINT \`fk_mae_meddb\` FOREIGN KEY (\`medication_database_id\`) REFERENCES \`medication_database\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table \`medication_warnings\`
--
ALTER TABLE \`medication_warnings\`
  ADD CONSTRAINT \`fk_mw_meddb\` FOREIGN KEY (\`medication_database_id\`) REFERENCES \`medication_database\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table \`user_trip_reports\`
--
ALTER TABLE \`user_trip_reports\`
  ADD CONSTRAINT \`fk_tr_climb\` FOREIGN KEY (\`climb_id\`) REFERENCES \`user_climbs\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
`, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(schemaSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleDownload = () => {
    const blob = new Blob([schemaSQL], { type: "text/sql;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summitcare_mysql_schema.sql";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card className="mb-4">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>MySQL Schema</CardTitle>
            <CardDescription>Copy or download the SQL to initialize your MySQL database.</CardDescription>
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
            Complete MySQL schema including all tables, indexes, and constraints. Run this in your MySQL client after selecting your target database.
          </div>
          <pre className="bg-slate-950 text-slate-100 rounded-lg p-4 overflow-auto text-sm max-h-[70vh]">
            <code>{schemaSQL}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}