export type AnyString = string & { _any?: never }
type CondType = string | number | boolean | never

type PossibleFieldName = 'type' | '_type' | AnyString
/**
 * Create an Unique type that can be added in an union
 * @param T is a Union of the above type
 * @param CondType is the unique condition to choose from
 * @param FieldName optional, in case you already have a "type" field that is not unique enough
 * @param Optional specifies if the FieldName should be optional
 */
export type MakeConditionalType<
    T,
    Type extends CondType,
    FieldName extends PossibleFieldName = 'type',
    Optional extends 'optional' | 'required' = 'required',
> = FieldName extends keyof T ? never : T & (Optional extends 'optional' ? Partial<Record<FieldName, Type>> : Record<FieldName, Type>)

/**
 * Pick one of the conditional types created
 * @param T is a Union of type {@link MakeConditionalType}
 * @param CondType is the unique condition to choose from
 * @param FieldName optional, in case you already have a "type" field that is not unique enough
 */
export type PickFromConditionalType<
    T extends Omit<MakeConditionalType<object, CondType, PossibleFieldName>, PossibleFieldName>,
    Type extends CondType,
    FieldName extends PossibleFieldName = 'type',
> = '_type' extends keyof T
    ? T & Record<'_type', Type>
    : 'type' extends keyof T
    ? T & Record<'type', Type>
    : FieldName extends keyof T
    ? T & Record<FieldName, Type>
    : never

export {}
