namespace ARE.Core.Results
{
    /// <summary>Tek bir kuralın değerlendirme sonucu</summary>
    public class RuleResult
    {
        public string RuleId { get; set; } = "";

        public bool ConditionsMet { get; set; }

        public List<string> ExecutedActions { get; set; } = new();

        public List<string> FailedConditions { get; set; } = new();

        public Exception? Error { get; set; }
    }
}
