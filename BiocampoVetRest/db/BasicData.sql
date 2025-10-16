INSERT INTO public.document_type (abbreviation, name) VALUES
('DNI', 'Documento Nacional de Identidad'),
('RUC', 'Registro Único de Contribuyentes'),
('CE', 'Carné de Extranjería'),
('PAS', 'Pasaporte'),
('PTP', 'Permiso Temporal de Permanencia'),
('SD', 'Sin Documento');

INSERT INTO public.customer (address, document_number, email, is_active, name, phone_number, document_type_id)
VALUES 
('Av. Los Héroes 123', '12345678', 'juan.perez@example.com', true, 'Juan Pérez', '987654321', 1),
('Calle Lima 456', '87654321', 'ana.garcia@example.com', true, 'Ana García', '912345678', 1),
('Jr. Amazonas 789', '11223344', 'carlos.lopez@example.com', true, 'Carlos López', '987123456', 2),
('Av. Libertad 321', '55667788', 'maria.torres@example.com', true, 'María Torres', '912987654', 2),
('Calle Grau 654', '99887766', 'pedro.sanchez@example.com', true, 'Pedro Sánchez', '911223344', 1);


INSERT INTO animal_specie (id, is_active, name) VALUES (1, true, 'Gato');
INSERT INTO animal_specie (id, is_active, name) VALUES (2, true, 'Vaca');
INSERT INTO animal_specie (id, is_active, name) VALUES (3, true, 'Toro');

INSERT INTO animal (id, name, birth_date, species_id, breed, customer_id, is_active) VALUES (1, 'Firulais', '2020-01-01', 1, 'H', 1, true);
INSERT INTO animal (id, name, birth_date, species_id,breed, customer_id, is_active) VALUES (2, 'Mishi', '2019-06-15', 2, 'D', 1, true);



