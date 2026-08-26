import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    type DraggableAttributes,
    DragOverlay,
    KeyboardSensor,
    MouseSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Table } from "@navikt/ds-react";
import { type CSSProperties, type ReactNode, useState } from "react";
export type TableDraggableBodyChildrenFn<T> = (
    dokument: T,
    index: number,
    id: string,
    attributes?: DraggableAttributes,
    listeners?: SyntheticListenerMap,
    style?: CSSProperties,
    ref?: (node: HTMLElement) => void,
) => ReactNode | null;
interface ITableDraggableBodyProps<T> {
    onChange: (event: DragEndEvent) => void;
    rowData: T[];
    getRowKey: (data: T) => string;
    children: TableDraggableBodyChildrenFn<T>;
}

export default function TableDraggableBody<T>({ children, onChange, rowData, getRowKey }: ITableDraggableBodyProps<T>) {
    const [activeId, setActiveId] = useState(null);
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                tolerance: 100,
                distance: 10,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    function handleDragStart(event) {
        const { active } = event;

        setActiveId(active.id);
    }
    const activeIndex = rowData.findIndex((data) => getRowKey(data) === activeId);
    const activeData = rowData.find((data) => getRowKey(data) === activeId);
    return (
        <DndContext
            sensors={sensors}
            onDragEnd={onChange}
            autoScroll={{ layoutShiftCompensation: true }}
            onDragStart={handleDragStart}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        >
            <SortableContext
                strategy={verticalListSortingStrategy}
                items={rowData.map((data) => ({
                    ...data,
                    id: getRowKey(data),
                }))}
            >
                <Table.Body style={{ overflowY: "auto" }}>
                    {rowData.map((data, i) => (
                        <SortableItem
                            key={getRowKey(data) + i}
                            data={data}
                            index={i}
                            id={getRowKey(data)}
                            children={children}
                        />
                    ))}
                </Table.Body>
            </SortableContext>
            <DragOverlay dropAnimation={null}>
                {activeId ? (
                    <OverlayItem id={activeId} data={activeData} index={activeIndex} children={children} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

interface OverlayItemProps<T> {
    id: string;
    data: T;
    index: number;
    children: TableDraggableBodyChildrenFn<T>;
}
function OverlayItem<T>({ id, children, data, index }: OverlayItemProps<T>) {
    return <>{children(data, index, id, null, null, { backgroundColor: "var(--ax-neutral-200)" })}</>;
}

interface SortableItemProps<T> {
    id: string;
    data: T;
    index: number;
    children: TableDraggableBodyChildrenFn<T>;
}
function SortableItem<T>({ id, children, data, index }: SortableItemProps<T>) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id,
        transition: {
            duration: 100, // milliseconds
            easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        },
    });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: "grab",
    };

    return <>{children(data, index, id, attributes, listeners, style, setNodeRef)}</>;
}
