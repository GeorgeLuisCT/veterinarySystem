-- Seed roles
INSERT INTO roles (name) VALUES
    ('ROLE_USER'),
    ('ROLE_ADMIN'),
    ('ROLE_VETERINARIAN'),
    ('ROLE_ASSISTANT'),
    ('ROLE_RECEPTIONIST'),
    ('ROLE_MANAGER'),
    ('ROLE_GROOMER'),
    ('ROLE_SUPERVISOR'),
    ('ROLE_WAREHOUSE'),
    ('ROLE_CASHIER')
ON CONFLICT (name) DO NOTHING;

-- Seed default company
INSERT INTO companies (name, industry)
VALUES ('Veterinaria BioCampoVet', 'Veterinaria')
ON CONFLICT (name) DO NOTHING;

-- Seed default branches for the company
INSERT INTO branches (name, location, company_id)
SELECT 'Primera sucursal', 'Dirección 123', c.id
FROM companies c
WHERE c.name = 'Veterinaria BioCampoVet'
ON CONFLICT (name) DO NOTHING;

INSERT INTO branches (name, location, company_id)
SELECT 'Segunda sucursal', 'Dirección 321', c.id
FROM companies c
WHERE c.name = 'Veterinaria BioCampoVet'
ON CONFLICT (name) DO NOTHING;

-- Seed document types
INSERT INTO document_type (name, abbreviation) VALUES
    ('Documento Nacional de Identidad', 'DNI'),
    ('Registro Único de Contribuyentes', 'RUC'),
    ('Carné de Extranjería', 'CE')
ON CONFLICT (name) DO UPDATE SET abbreviation = EXCLUDED.abbreviation;

-- Seed customers
INSERT INTO customer (name, email, phone_number, address, is_active, document_type_id, document_number)
SELECT 'Juan Pérez', 'juan.perez@example.com', '999111222', 'Av. Siempre Viva 123, Chiclayo', true,
       dt.id, '12345678'
FROM document_type dt
WHERE dt.abbreviation = 'DNI'
ON CONFLICT (document_number) DO NOTHING;

INSERT INTO customer (name, email, phone_number, address, is_active, document_type_id, document_number)
SELECT 'María López', 'maria.lopez@example.com', '999333444', 'Jr. Los Olivos 456, Chiclayo', true,
       dt.id, '87654321'
FROM document_type dt
WHERE dt.abbreviation = 'DNI'
ON CONFLICT (document_number) DO NOTHING;

INSERT INTO customer (name, email, phone_number, address, is_active, document_type_id, document_number)
SELECT 'Tienda PetVet S.A.C.', 'contacto@petvet.pe', '074-222333', 'Calle Comercio 789, Chiclayo', true,
       dt.id, '20601234567'
FROM document_type dt
WHERE dt.abbreviation = 'RUC'
ON CONFLICT (document_number) DO NOTHING;

-- Seed animals
-- Firulais (Perro)
WITH owner AS (
    SELECT id FROM customer WHERE document_number = '12345678'
)
INSERT INTO animal (customer_id, name, species, breed, birth_date, sex, microchip_number, photo_url, is_active)
SELECT owner.id, 'Firulais', 'CANINE', 'Mestizo', DATE '2021-01-15', 'MALE', NULL, NULL, true
FROM owner
WHERE NOT EXISTS (
    SELECT 1 FROM animal WHERE LOWER(name) = LOWER('Firulais') AND customer_id = owner.id
);

-- Mishi (Gato)
WITH owner AS (
    SELECT id FROM customer WHERE document_number = '12345678'
)
INSERT INTO animal (customer_id, name, species, breed, birth_date, sex, microchip_number, photo_url, is_active)
SELECT owner.id, 'Mishi', 'FELINE', 'Siames', DATE '2022-03-10', 'FEMALE', NULL, NULL, true
FROM owner
WHERE NOT EXISTS (
    SELECT 1 FROM animal WHERE LOWER(name) = LOWER('Mishi') AND customer_id = owner.id
);

-- Pelusa (Gato)
WITH owner AS (
    SELECT id FROM customer WHERE document_number = '87654321'
)
INSERT INTO animal (customer_id, name, species, breed, birth_date, sex, microchip_number, photo_url, is_active)
SELECT owner.id, 'Pelusa', 'FELINE', 'Persa', DATE '2020-07-05', 'FEMALE', 'MICRO-0001', NULL, true
FROM owner
WHERE NOT EXISTS (
    SELECT 1 FROM animal WHERE LOWER(name) = LOWER('Pelusa') AND customer_id = owner.id
);

-- Guardian (Perro)
WITH owner AS (
    SELECT id FROM customer WHERE document_number = '20601234567'
)
INSERT INTO animal (customer_id, name, species, breed, birth_date, sex, microchip_number, photo_url, is_active)
SELECT owner.id, 'Guardian', 'CANINE', 'Pastor Alemán', DATE '2019-11-20', 'MALE', 'MICRO-0002', NULL, true
FROM owner
WHERE NOT EXISTS (
    SELECT 1 FROM animal WHERE LOWER(name) = LOWER('Guardian') AND customer_id = owner.id
);

-- Seed animal allergies
INSERT INTO animal_allergies (animal_id, allergy)
SELECT a.id, 'Polen'
FROM animal a
JOIN customer c ON a.customer_id = c.id
WHERE LOWER(a.name) = LOWER('Firulais') AND c.document_number = '12345678'
  AND NOT EXISTS (
      SELECT 1 FROM animal_allergies aa WHERE aa.animal_id = a.id AND aa.allergy = 'Polen'
  );

INSERT INTO animal_allergies (animal_id, allergy)
SELECT a.id, 'Atún'
FROM animal a
JOIN customer c ON a.customer_id = c.id
WHERE LOWER(a.name) = LOWER('Pelusa') AND c.document_number = '87654321'
  AND NOT EXISTS (
      SELECT 1 FROM animal_allergies aa WHERE aa.animal_id = a.id AND aa.allergy = 'Atún'
  );

-- Seed animal chronic conditions
INSERT INTO animal_chronic_conditions (animal_id, condition)
SELECT a.id, 'Dermatitis'
FROM animal a
JOIN customer c ON a.customer_id = c.id
WHERE LOWER(a.name) = LOWER('Firulais') AND c.document_number = '12345678'
  AND NOT EXISTS (
      SELECT 1 FROM animal_chronic_conditions ac WHERE ac.animal_id = a.id AND ac.condition = 'Dermatitis'
  );

INSERT INTO animal_chronic_conditions (animal_id, condition)
SELECT a.id, 'Asma felina'
FROM animal a
JOIN customer c ON a.customer_id = c.id
WHERE LOWER(a.name) = LOWER('Mishi') AND c.document_number = '12345678'
  AND NOT EXISTS (
      SELECT 1 FROM animal_chronic_conditions ac WHERE ac.animal_id = a.id AND ac.condition = 'Asma felina'
  );

INSERT INTO animal_chronic_conditions (animal_id, condition)
SELECT a.id, 'Displasia de cadera'
FROM animal a
JOIN customer c ON a.customer_id = c.id
WHERE LOWER(a.name) = LOWER('Guardian') AND c.document_number = '20601234567'
  AND NOT EXISTS (
      SELECT 1 FROM animal_chronic_conditions ac WHERE ac.animal_id = a.id AND ac.condition = 'Displasia de cadera'
  );

-- Seed product categories
INSERT INTO category_product (name, is_active) VALUES
    ('Medicamentos veterinarios', true),
    ('Cuidado e higiene', true)
ON CONFLICT (name) DO UPDATE SET is_active = EXCLUDED.is_active;

-- Seed products
INSERT INTO products (name, description, min_stock, category_id, sku, presentation, unit_type, standard_price, content_total)
SELECT 'Antiparasitario Canino Oral',
       'Tabletas palatables para control integral de parásitos internos y externos en caninos.',
       10,
       c.id,
       'ANTIP-001',
       'BOX',
       'TABLET',
       45.00,
       6.0
FROM category_product c
WHERE c.name = 'Medicamentos veterinarios'
ON CONFLICT (sku) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    min_stock = EXCLUDED.min_stock,
    category_id = EXCLUDED.category_id,
    presentation = EXCLUDED.presentation,
    unit_type = EXCLUDED.unit_type,
    standard_price = EXCLUDED.standard_price,
    content_total = EXCLUDED.content_total;

INSERT INTO products (name, description, min_stock, category_id, sku, presentation, unit_type, standard_price, content_total)
SELECT 'Shampoo Dermoprotector',
       'Shampoo neutro con agentes calmantes para pieles sensibles y tratamientos dermatológicos.',
       8,
       c.id,
       'GROOM-001',
       'BOTTLE',
       'MILLILITER',
       32.50,
       500.0
FROM category_product c
WHERE c.name = 'Cuidado e higiene'
ON CONFLICT (sku) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    min_stock = EXCLUDED.min_stock,
    category_id = EXCLUDED.category_id,
    presentation = EXCLUDED.presentation,
    unit_type = EXCLUDED.unit_type,
    standard_price = EXCLUDED.standard_price,
    content_total = EXCLUDED.content_total;

-- Seed initial stock per branch
INSERT INTO product_branch_stock (branch_id, product_id, is_active, stock_units, stock_fractional)
SELECT b.id, p.id, true, 0, 0.0
FROM branches b
JOIN products p ON p.sku IN ('ANTIP-001', 'GROOM-001')
WHERE b.name IN ('Primera sucursal', 'Segunda sucursal')
  AND NOT EXISTS (
      SELECT 1 FROM product_branch_stock s WHERE s.branch_id = b.id AND s.product_id = p.id
  );

-- Seed clinical services
INSERT INTO clinical_services (name, clinical_service_category, description, price, reminder_period, reminder_period_unit)
VALUES (
    'Consulta Clínica General',
    'CONSULTATION',
    'Evaluación integral del paciente con anamnesis completa, exploración física y plan terapéutico.',
    60.00,
    12,
    'MONTHS'
)
ON CONFLICT (name) DO UPDATE
SET clinical_service_category = EXCLUDED.clinical_service_category,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    reminder_period = EXCLUDED.reminder_period,
    reminder_period_unit = EXCLUDED.reminder_period_unit;

INSERT INTO clinical_services (name, clinical_service_category, description, price, reminder_period, reminder_period_unit)
VALUES (
    'Baño Medicado Dermoprotector',
    'GROOMING',
    'Baño terapéutico con productos dermoprotectores para control de dermatitis y alergias.',
    45.00,
    NULL,
    NULL
)
ON CONFLICT (name) DO UPDATE
SET clinical_service_category = EXCLUDED.clinical_service_category,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    reminder_period = EXCLUDED.reminder_period,
    reminder_period_unit = EXCLUDED.reminder_period_unit;

INSERT INTO clinical_services (name, clinical_service_category, description, price, reminder_period, reminder_period_unit)
VALUES (
    'Profilaxis Quirúrgica Canina',
    'SURGERY',
    'Servicio prequirúrgico que incluye evaluación, profilaxis antibiótica y seguimiento post operatorio.',
    220.00,
    6,
    'MONTHS'
)
ON CONFLICT (name) DO UPDATE
SET clinical_service_category = EXCLUDED.clinical_service_category,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    reminder_period = EXCLUDED.reminder_period,
    reminder_period_unit = EXCLUDED.reminder_period_unit;

-- Link clinical services with required products
INSERT INTO clinical_service_required_products (clinical_service_id, product_id)
SELECT cs.id, p.id
FROM clinical_services cs
JOIN products p ON p.sku = 'GROOM-001'
WHERE cs.name = 'Baño Medicado Dermoprotector'
  AND NOT EXISTS (
      SELECT 1 FROM clinical_service_required_products rp
      WHERE rp.clinical_service_id = cs.id AND rp.product_id = p.id
  );

INSERT INTO clinical_service_required_products (clinical_service_id, product_id)
SELECT cs.id, p.id
FROM clinical_services cs
JOIN products p ON p.sku = 'ANTIP-001'
WHERE cs.name = 'Profilaxis Quirúrgica Canina'
  AND NOT EXISTS (
      SELECT 1 FROM clinical_service_required_products rp
      WHERE rp.clinical_service_id = cs.id AND rp.product_id = p.id
  );

-- Link clinical services to branches
INSERT INTO branch_clinical_services (branch_id, clinical_service_id, is_active)
SELECT b.id, cs.id, true
FROM branches b
JOIN clinical_services cs ON cs.name IN (
    'Consulta Clínica General',
    'Baño Medicado Dermoprotector',
    'Profilaxis Quirúrgica Canina'
)
WHERE b.name IN ('Primera sucursal', 'Segunda sucursal')
  AND NOT EXISTS (
      SELECT 1 FROM branch_clinical_services bcs
      WHERE bcs.branch_id = b.id AND bcs.clinical_service_id = cs.id
  );

-- Seed operating rooms
INSERT INTO operating_rooms (name, branch_id, notes)
SELECT b.name || ' - Quirófano Principal', b.id, 'Quirófano inicial generado automáticamente.'
FROM branches b
WHERE NOT EXISTS (
    SELECT 1 FROM operating_rooms oroom
    WHERE oroom.branch_id = b.id AND oroom.name = b.name || ' - Quirófano Principal'
);

-- Seed laboratories
INSERT INTO laboratories (name, branch_id, contact_name, contact_phone, contact_email, notes)
SELECT 'Laboratorio Central ' || b.name, b.id, 'Dra. Carolina Ríos', '074-555000', 'laboratorio.central@biocampovet.pe',
       'Laboratorio interno con foco en análisis generales.'
FROM branches b
WHERE b.name = 'Primera sucursal'
  AND NOT EXISTS (
      SELECT 1 FROM laboratories lab WHERE lab.branch_id = b.id AND lab.name = 'Laboratorio Central ' || b.name
  );

INSERT INTO laboratories (name, branch_id, contact_name, contact_phone, contact_email, notes)
SELECT 'Laboratorio Especializado ' || b.name, b.id, 'Dr. Julio Vargas', '074-555111', 'laboratorio.especializado@biocampovet.pe',
       'Laboratorio asociado para estudios especializados y cultivos.'
FROM branches b
WHERE b.name = 'Segunda sucursal'
  AND NOT EXISTS (
      SELECT 1 FROM laboratories lab WHERE lab.branch_id = b.id AND lab.name = 'Laboratorio Especializado ' || b.name
  );

-- Seed laboratory tests
INSERT INTO laboratory_tests (code, name, description, active, price) VALUES
('HEMO_COMP', 'Hemograma Completo', 'Análisis completo de células sanguíneas.', true, 50.00),
('PERF_BIOQ', 'Perfil Bioquímico', 'Evaluación de función renal, hepática y pancreática.', true, 80.00),
('URO_ANAL', 'Uroanálisis', 'Análisis físico, químico y microscópico de la orina.', true, 40.00)
ON CONFLICT (code) DO NOTHING;

-- Link laboratory tests to laboratories
INSERT INTO laboratory_test_laboratories (laboratory_test_id, laboratory_id, is_active)
SELECT lt.id, l.id, true
FROM laboratory_tests lt, laboratories l
WHERE lt.code = 'HEMO_COMP' AND l.name = 'Laboratorio Central Primera sucursal'
ON CONFLICT (laboratory_test_id, laboratory_id) DO NOTHING;

INSERT INTO laboratory_test_laboratories (laboratory_test_id, laboratory_id, is_active)
SELECT lt.id, l.id, true
FROM laboratory_tests lt, laboratories l
WHERE lt.code = 'PERF_BIOQ' AND l.name = 'Laboratorio Central Primera sucursal'
ON CONFLICT (laboratory_test_id, laboratory_id) DO NOTHING;

INSERT INTO laboratory_test_laboratories (laboratory_test_id, laboratory_id, is_active)
SELECT lt.id, l.id, true
FROM laboratory_tests lt, laboratories l
WHERE lt.code = 'URO_ANAL' AND l.name = 'Laboratorio Especializado Segunda sucursal'
ON CONFLICT (laboratory_test_id, laboratory_id) DO NOTHING;

INSERT INTO laboratory_test_laboratories (laboratory_test_id, laboratory_id, is_active)
SELECT lt.id, l.id, true
FROM laboratory_tests lt, laboratories l
WHERE lt.code = 'HEMO_COMP' AND l.name = 'Laboratorio Especializado Segunda sucursal'
ON CONFLICT (laboratory_test_id, laboratory_id) DO NOTHING;

-- Seed cages for branches
INSERT INTO cages (name, size, is_occupied, branch_id)
SELECT 'Jaula 01', 'SMALL', false, b.id
FROM branches b WHERE b.name = 'Primera sucursal'
ON CONFLICT (name) DO NOTHING;

INSERT INTO cages (name, size, is_occupied, branch_id)
SELECT 'Jaula 02', 'MEDIUM', false, b.id
FROM branches b WHERE b.name = 'Primera sucursal'
ON CONFLICT (name) DO NOTHING;

INSERT INTO cages (name, size, is_occupied, branch_id)
SELECT 'Jaula 03', 'LARGE', false, b.id
FROM branches b WHERE b.name = 'Primera sucursal'
ON CONFLICT (name) DO NOTHING;

INSERT INTO cages (name, size, is_occupied, branch_id)
SELECT 'Jaula 04', 'SMALL', false, b.id
FROM branches b WHERE b.name = 'Segunda sucursal'
ON CONFLICT (name) DO NOTHING;

INSERT INTO cages (name, size, is_occupied, branch_id)
SELECT 'Jaula 05', 'MEDIUM', false, b.id
FROM branches b WHERE b.name = 'Segunda sucursal'
ON CONFLICT (name) DO NOTHING;

INSERT INTO cages (name, size, is_occupied, branch_id)
SELECT 'Jaula 06', 'LARGE', false, b.id
FROM branches b WHERE b.name = 'Segunda sucursal'
ON CONFLICT (name) DO NOTHING;
