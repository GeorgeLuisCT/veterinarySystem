import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { debounce } from "lodash";

interface SelectableComboboxProps<T, V> {
  name: string;
  fetchOptions: (query: string) => Promise<T[]>;
  optionLabel: (item: T) => string;
  optionValue: (item: T) => V;
  placeholder?: string;
}

export function SelectableCombobox<T, V>({
    name,
    fetchOptions,
    optionLabel,
    optionValue,
    placeholder = "Seleccionar una opción",
}: SelectableComboboxProps<T, V>) {
    const { control, setValue } = useFormContext();
    const [options, setOptions] = React.useState<T[]>([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [popoverOpen, setPopoverOpen] = React.useState(false);
    const triggerRef = React.useRef<HTMLButtonElement>(null);

    const fetchDebouncedOptions = React.useCallback(
        debounce(async (query: string) => {
            if (query.length < 2) return;
            const result = await fetchOptions(query);
            setOptions(result);
        }, 500),
        [fetchOptions]
    );

    React.useEffect(() => {
        if (searchTerm.trim()) {
            fetchDebouncedOptions(searchTerm);
        }
    }, [searchTerm]);

    return (
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormControl>
                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    ref={triggerRef}
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                >
                                    {field.value
                                        ? optionLabel(options.find((opt) => optionValue(opt) === field.value) || {} as T)
                                        : placeholder}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                style={{ width: triggerRef.current?.offsetWidth }}
                                className="p-0"
                            >
                                <Command>
                                    <CommandInput
                                        placeholder="Buscar..."
                                        className="h-9"
                                        onValueChange={setSearchTerm}
                                    />
                                    <CommandList>
                                        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                                        <CommandGroup>
                                            {options.map((option) => (
                                                <CommandItem
                                                    key={String(optionValue(option))}
                                                    value={optionLabel(option)}
                                                    onSelect={() => {
                                                        field.onChange(optionValue(option));
                                                        setValue("name", optionLabel(option));
                                                        setPopoverOpen(false);
                                                    }}
                                                >
                                                    {optionLabel(option)}
                                                    <Check
                                                        className={cn(
                                                            "ml-auto",
                                                            optionValue(option) === field.value ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
