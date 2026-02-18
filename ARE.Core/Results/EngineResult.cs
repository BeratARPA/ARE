using ARE.Core.Abstractions;

namespace ARE.Core.Results
{
    /// <summary>Bir event işleme sonucu</summary>
    public class EngineResult
    {
        public IEvent Event { get; set; } = null!;

        public List<RuleResult> FiredRules { get; set; } = new();

        public List<RuleResult> SkippedRules { get; set; } = new();

        public bool PipelineStopped { get; set; }

        public TimeSpan Duration { get; set; }
    }
}
